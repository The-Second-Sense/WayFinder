package com.example.backend_wayfinder.service.impl;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.*;
import com.example.backend_wayfinder.entities.AccountEntity;
import com.example.backend_wayfinder.entities.UserEntity;
import com.example.backend_wayfinder.repository.AccountRepository;
import com.example.backend_wayfinder.repository.UserRepository;
import com.example.backend_wayfinder.service.AuthenticationService;
import com.example.backend_wayfinder.service.JwtService;
import com.example.backend_wayfinder.service.ModalAiService;
import com.example.backend_wayfinder.service.UserService;
import com.example.backend_wayfinder.service.VoiceAuthenticationService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AuthenticationServiceImpl implements AuthenticationService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final VoiceAuthenticationService voiceAuthenticationService;
    private final ModalAiService modalAiService;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final UserService userService;

    // In-memory session storage (replace with Redis in production)
    private final Map<String, UUID> activeSessions = new HashMap<>();

    @Override
    public AuthenticationResponse login(String phone, String password) {
        log.info("Attempting login for phone: {}", phone);

        UserEntity user = userRepository.findByPhoneNumber(phone)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            log.warn("Invalid password attempt for phone: {}", phone);
            throw new RuntimeException("Invalid credentials");
        }


        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // Generate JWT tokens
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        log.info("Login successful for user ID: {}", user.getUserId());

        // Fetch user's accounts
        List<AccountEntity> accountEntities = accountRepository.findByUser_UserId(user.getUserId());
        List<AccountDto> accounts = accountEntities.stream()
                .map(this::convertAccountToDto)
                .collect(java.util.stream.Collectors.toList());

        UserDto userDto = UserDto.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .isVoiceAuthEnabled(user.getIsVoiceAuthEnabled())
                .voiceFingerprint(user.getVoiceFingerprint())
                .transferPin(user.getTransferPin())
                .createdAt(user.getCreatedAt())
                .lastLogin(user.getLastLogin())
                .build();

        return AuthenticationResponse.builder()
                .success(true)
                .message("Login successful")
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userDto)
                .accounts(accounts)
                .requiresMfa(false)
                .build();
    }

    @Override
    public AuthenticationResponse voiceLogin(byte[] voiceSample, String email) {
        log.info("Attempting voice login for email: {}", email);

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getIsVoiceAuthEnabled()) {
            throw new RuntimeException("Voice authentication not enabled for this user");
        }

        if (user.getVoiceFingerprint() == null || user.getVoiceFingerprint().isEmpty()) {
            throw new RuntimeException("No voice profile found for this user");
        }

        try {
            // Convert voice sample bytes to base64 for Modal API
            String base64Audio = Base64.getEncoder().encodeToString(voiceSample);

            // Extract fingerprint using Modal WavLM model
            log.info("Extracting voice fingerprint from audio sample...");
            List<Double> currentFingerprint = modalAiService.extractVoiceFingerprint(base64Audio);

            if (currentFingerprint.size() != 512) {
                throw new RuntimeException("Invalid fingerprint dimension: " + currentFingerprint.size());
            }

            // Verify voice against stored fingerprint
            boolean isVoiceValid = voiceAuthenticationService.verifyVoice(
                currentFingerprint,
                user.getVoiceFingerprint()
            );

            if (!isVoiceValid) {
                log.warn("Voice authentication failed for user: {}", email);
                throw new RuntimeException("Voice authentication failed - voice does not match");
            }

            log.info("Voice authentication successful for user: {}", email);

            // Update last login
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            // Fetch accounts
            List<AccountEntity> accountEntities = accountRepository.findByUser_UserId(user.getUserId());
            List<AccountDto> accounts = accountEntities.stream()
                    .map(this::convertAccountToDto)
                    .collect(java.util.stream.Collectors.toList());

            // Generate JWT tokens
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
            String accessToken = jwtService.generateToken(userDetails);
            String refreshToken = jwtService.generateRefreshToken(userDetails);

            // Return authentication response (same as regular login)
            UserDto userDto = UserDto.builder()
                    .userId(user.getUserId())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .phoneNumber(user.getPhoneNumber())
                    .isVoiceAuthEnabled(user.getIsVoiceAuthEnabled())
                    .transferPin(user.getTransferPin())
                    .createdAt(user.getCreatedAt())
                    .lastLogin(user.getLastLogin())
                    .build();

            return AuthenticationResponse.builder()
                    .success(true)
                    .message("Voice login successful")
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .user(userDto)
                    .accounts(accounts)
                    .requiresMfa(false)
                    .build();

        } catch (Exception e) {
            log.error("Voice login failed: {}", e.getMessage(), e);
            throw new RuntimeException("Voice login failed: " + e.getMessage());
        }
    }

    @Override
    public void logout(UUID userId) {
        log.info("Logging out user ID: {}", userId);

        // Remove all sessions for this user
        activeSessions.entrySet().removeIf(entry -> entry.getValue().equals(userId));

        log.info("User ID {} logged out successfully", userId);
    }


    @Override
    public boolean changePassword(UUID userId, String currentPassword, String newPassword) {
        log.info("Changing password for user ID: {}", userId);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            log.warn("Invalid current password for user ID: {}", userId);
            return false;
        }

        // Update to new password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        log.info("Password changed successfully for user ID: {}", userId);
        return true;
    }

    @Override
    public boolean validateCredentials(String phone, String password) {
        try {
            UserEntity user = userRepository.findByPhoneNumber(phone).orElse(null);

            if (user == null) {
                return false;
            }

            return passwordEncoder.matches(password, user.getPasswordHash());
        } catch (Exception e) {
            log.error("Error validating credentials for phone: {}", phone, e);
            return false;
        }
    }

    @Override
    public boolean validateVoiceAuthentication(byte[] voiceSample, UUID userId) {
        log.info("Validating voice authentication for user ID: {}", userId);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getIsVoiceAuthEnabled()) {
            log.warn("Voice authentication not enabled for user ID: {}", userId);
            return false;
        }

        if (user.getVoiceFingerprint() == null || user.getVoiceFingerprint().isEmpty()) {
            log.warn("No voice fingerprint found for user ID: {}", userId);
            return false;
        }

        try {
            // Convert voice sample to base64
            String base64Audio = Base64.getEncoder().encodeToString(voiceSample);

            // Extract fingerprint using Modal
            List<Double> currentFingerprint = modalAiService.extractVoiceFingerprint(base64Audio);

            if (currentFingerprint.size() != 512) {
                log.error("Invalid fingerprint dimension: {}", currentFingerprint.size());
                return false;
            }

            // Verify voice
            boolean isValid = voiceAuthenticationService.verifyVoice(
                currentFingerprint,
                user.getVoiceFingerprint()
            );

            log.info("Voice validation result for user ID {}: {}", userId, isValid);
            return isValid;

        } catch (Exception e) {
            log.error("Voice validation failed: {}", e.getMessage(), e);
            return false;
        }
    }

    @Override
    public void invalidateAllSessions(UUID userId) {
        log.info("Invalidating all sessions for user ID: {}", userId);
        activeSessions.entrySet().removeIf(entry -> entry.getValue().equals(userId));
        log.info("All sessions invalidated for user ID: {}", userId);
    }

    @Override
    public boolean isSessionValid(String sessionToken) {
        return activeSessions.containsKey(sessionToken);
    }

    @Override
    public AuthenticationResponse register(CreateUserRequest request) {
        log.info("Attempting register for email: {}", request.getEmail());

        UserDto createdUser = userService.createUser(request);
        UserEntity user = userRepository.findById(createdUser.getUserId())
                .orElseThrow(() -> new RuntimeException("User created but not found"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        List<AccountEntity> accountEntities = accountRepository.findByUser_UserId(user.getUserId());
        List<AccountDto> accounts = accountEntities.stream()
                .map(this::convertAccountToDto)
                .collect(java.util.stream.Collectors.toList());

        return AuthenticationResponse.builder()
                .success(true)
                .message("Registration successful")
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(createdUser)
                .accounts(accounts)
                .requiresMfa(false)
                .build();
    }

    // Helper methods

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***@***.com";
        }

        String[] parts = email.split("@");
        String localPart = parts[0];
        String domain = parts[1];

        if (localPart.length() <= 2) {
            return localPart.charAt(0) + "***@" + domain;
        }

        return localPart.charAt(0) + "***" + localPart.charAt(localPart.length() - 1) + "@" + domain;
    }

    private String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 4) {
            return "***-***-****";
        }
        String lastFour = phoneNumber.substring(phoneNumber.length() - 4);
        return "***-***-" + lastFour;
    }

    private AccountDto convertAccountToDto(AccountEntity account) {
        return AccountDto.builder()
                .accountId(account.getAccountId())
                .userId(account.getUser().getUserId())
                .accountNumber(account.getAccountNumber())
                .accountType(account.getAccountType())
                .currency(account.getCurrency())
                .balance(account.getBalance())
                .isActive(account.getIsActive())
                .createdAt(account.getCreatedAt())
                .build();
    }
}

