package com.example.backend_wayfinder.service.impl;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.*;
import com.example.backend_wayfinder.entities.UserEntity;
import com.example.backend_wayfinder.repository.UserRepository;
import com.example.backend_wayfinder.service.AuthenticationService;
import com.example.backend_wayfinder.service.VoiceAuthenticationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AuthenticationServiceImpl implements AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final VoiceAuthenticationService voiceAuthenticationService;

    // In-memory session storage (replace with Redis in production)
    private final Map<String, UUID> activeSessions = new HashMap<>();

    @Override
    public AuthenticationResponse login(String email, String password) {
        log.info("Attempting login for email: {}", email);

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            log.warn("Invalid password attempt for email: {}", email);
            throw new RuntimeException("Invalid credentials");
        }

        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // Generate session token (access token)
        String sessionToken = UUID.randomUUID().toString();
        activeSessions.put(sessionToken, user.getUserId());

        log.info("Login successful for user ID: {}", user.getUserId());

        // Build UserDto for response
        UserDto userDto = UserDto.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .isVoiceAuthEnabled(user.getIsVoiceAuthEnabled())
                .voiceFingerprint(user.getVoiceFingerprint())
                .createdAt(user.getCreatedAt())
                .lastLogin(user.getLastLogin())
                .build();

        return AuthenticationResponse.builder()
                .success(true)
                .message("Login successful")
                .accessToken(sessionToken)
                .refreshToken(UUID.randomUUID().toString()) // Generate refresh token
                .user(userDto)
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

        // TODO: Convert voiceSample (byte[]) to fingerprint (List<Double>)
        // This requires calling your Python WavLM model hosted on Modal
        // For now, we'll throw an exception with instructions

        log.error("Voice sample processing not yet implemented");
        throw new RuntimeException("Voice login requires integration with WavLM model on Modal. " +
                "Please convert the audio bytes to a 512-dimensional fingerprint first, " +
                "then use the standard login endpoint with voice fingerprint verification.");

        // After Modal integration, the code would look like:
        // List<Double> currentFingerprint = wavlmModalClient.extractFingerprint(voiceSample);
        // boolean isVoiceValid = voiceAuthenticationService.verifyVoice(currentFingerprint, user.getVoiceProfileId());
        // if (!isVoiceValid) {
        //     throw new RuntimeException("Voice authentication failed");
        // }
        // ... rest of login logic (same as regular login)
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
    public boolean validateCredentials(String email, String password) {
        try {
            UserEntity user = userRepository.findByEmail(email).orElse(null);

            if (user == null) {
                return false;
            }

            return passwordEncoder.matches(password, user.getPasswordHash());
        } catch (Exception e) {
            log.error("Error validating credentials for email: {}", email, e);
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

        // TODO: Convert voiceSample to fingerprint and validate
        // This requires Modal integration with WavLM model
        log.error("Voice sample processing not yet implemented");
        throw new RuntimeException("Voice authentication requires Modal integration. " +
                "Please extract fingerprint first using WavLM model.");
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

        // Show last 4 digits only
        String lastFour = phoneNumber.substring(phoneNumber.length() - 4);
        return "***-***-" + lastFour;
    }
}

