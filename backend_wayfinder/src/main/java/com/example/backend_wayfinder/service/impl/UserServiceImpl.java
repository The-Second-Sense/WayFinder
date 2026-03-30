package com.example.backend_wayfinder.service.impl;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.CreateUserRequest;
import com.example.backend_wayfinder.Dto.UpdateUserRequest;
import com.example.backend_wayfinder.Dto.UserDto;
import com.example.backend_wayfinder.entities.AccountEntity;
import com.example.backend_wayfinder.entities.UserEntity;
import com.example.backend_wayfinder.repository.AccountRepository;
import com.example.backend_wayfinder.repository.UserRepository;
import com.example.backend_wayfinder.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UserDto createUser(CreateUserRequest request) {
        log.info("Creating new user with email: {}", request.getEmail());

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("User with email " + request.getEmail() + " already exists");
        }

        // Build and save user entity
        UserEntity user = UserEntity.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .transferPin(request.getTransferPin())
                .isVoiceAuthEnabled(false)
                .build();

        UserEntity savedUser = userRepository.save(user);
        log.info("User created successfully with ID: {}", savedUser.getUserId());

        // Auto-create a default RON CURRENT account for the new user

        AccountEntity defaultAccount = AccountEntity.builder()
                .user(savedUser)
                .accountNumber(generateAccountNumber())
                .accountType("CURENT")
                .balance(new BigDecimal("1000"))
                .currency("RON")
                .isActive(true)
                .build();

        accountRepository.save(defaultAccount);
        log.info("Default CURRENT/RON account created for user ID: {}", savedUser.getUserId());

        return mapToDto(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getUserById(UUID userId) {
        log.info("Fetching user by ID: {}", userId);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        return mapToDto(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getUserByEmail(String email) {
        log.info("Fetching user by email: {}", email);

        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

        return mapToDto(user);
    }

    @Override
    @Transactional
    public UserDto updateUserProfile(UUID userId, UpdateUserRequest request) {
        log.info("Updating user profile for ID: {}", userId);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        // Update only provided fields (partial update)
        if (request.getEmail() != null) {
            // Check if new email is already taken by another user
            userRepository.findByEmail(request.getEmail())
                    .ifPresent(existingUser -> {
                        if (!existingUser.getUserId().equals(userId)) {
                            throw new IllegalArgumentException("Email already taken by another user");
                        }
                    });
            user.setEmail(request.getEmail());
            log.info("Updated email for user ID: {}", userId);
        }

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
            log.info("Updated full name for user ID: {}", userId);
        }

        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
            log.info("Updated phone number for user ID: {}", userId);
        }

        UserEntity updatedUser = userRepository.save(user);
        log.info("User profile updated successfully for ID: {}", userId);

        return mapToDto(updatedUser);
    }

    @Override
    @Transactional
    public void deleteUser(UUID userId) {
        log.info("Deleting user with ID: {}", userId);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        // TODO: Add additional cleanup logic
        // - Delete associated accounts
        // - Delete associated beneficiaries
        // - Delete associated transactions
        // - Delete AI interaction logs
        // Or use cascade delete in entity relationships

        userRepository.delete(user);
        log.info("User deleted successfully with ID: {}", userId);
    }

    @Override
    @Transactional
    public UserDto enableVoiceAuth(UUID userId, byte[] voiceFingerprint) {
        log.info("Enabling voice authentication for user ID: {}", userId);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        if (voiceFingerprint == null || voiceFingerprint.length == 0) {
            throw new IllegalArgumentException("Voice fingerprint cannot be empty");
        }

        user.setVoiceFingerprint(new ArrayList<>());
        user.setIsVoiceAuthEnabled(true);
        UserEntity updatedUser = userRepository.save(user);
        log.info("Voice authentication enabled successfully for user ID: {}", userId);
        return mapToDto(updatedUser);
    }

    @Override
    @Transactional
    public UserDto disableVoiceAuth(UUID userId) {
        log.info("Disabling voice authentication for user ID: {}", userId);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        user.setIsVoiceAuthEnabled(false);
        user.setVoiceFingerprint(null);
        UserEntity updatedUser = userRepository.save(user);
        log.info("Voice authentication disabled successfully for user ID: {}", userId);
        return mapToDto(updatedUser);
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private String generateAccountNumber() {
        Random random = new Random();
        StringBuilder sb = new StringBuilder("RO");
        for (int i = 0; i < 16; i++) {
            sb.append(random.nextInt(10));
        }
        // Ensure uniqueness
        while (accountRepository.existsByAccountNumber(sb.toString())) {
            sb = new StringBuilder("RO");
            for (int i = 0; i < 16; i++) {
                sb.append(random.nextInt(10));
            }
        }
        return sb.toString();
    }

    private UserDto mapToDto(UserEntity user) {
        return UserDto.builder()
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
    }
}
