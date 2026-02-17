package com.example.backend_wayfinder.controller;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.*;
import com.example.backend_wayfinder.service.AuthenticationService;
import com.example.backend_wayfinder.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*") // Configure properly in production
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final UserService userService;

    /**
     * User registration (Create account)
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody CreateUserRequest request) {
        log.info("Registration request for email: {}", request.getEmail());

        try {
            UserDto user = userService.createUser(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(user);
        } catch (IllegalArgumentException e) {
            log.error("Registration failed: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * Upload voice samples for biometric setup
     * POST /api/auth/voice-reg
     */
    @PostMapping("/voice-reg")
    public ResponseEntity<UserDto> registerVoiceSample(
            @RequestParam UUID userId,
            @RequestParam String phraseId,
            @RequestBody byte[] audioFile) {

        log.info("Voice registration for user ID: {}, phrase: {}", userId, phraseId);

        try {
            // TODO: Process audio file through Modal WavLM model to get fingerprint
            // For now, using placeholder
            UserDto user = userService.enableVoiceAuth(userId, audioFile);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            log.error("Voice registration failed: {}", e.getMessage());
            throw new RuntimeException("Voice registration failed: " + e.getMessage());
        }
    }

    /**
     * Authenticate user (Login)
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(@RequestBody LoginRequest request) {
        log.info("Login request for: {}", request.getEmail() != null ? request.getEmail() : request.getPhone());

        try {
            AuthenticationResponse response;

            if (request.getEmail() != null && request.getPassword() != null) {
                // Email/password login
                response = authenticationService.login(request.getEmail(), request.getPassword());
            } else if (request.getVoiceAuth() != null && request.getVoiceAuth()) {
                // Voice authentication login
                response = authenticationService.voiceLogin(request.getAudioSample(), request.getEmail());
            } else {
                throw new RuntimeException("Invalid login credentials");
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Login failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthenticationResponse.builder()
                            .success(false)
                            .message(e.getMessage())
                            .build());
        }
    }

    /**
     * Logout user
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader("Authorization") String token) {
        log.info("Logout request");

        try {
            // Extract user ID from token (simplified - in production parse JWT)
            // For now, assuming token management is handled elsewhere
            // authenticationService.logout(userId);
            return ResponseEntity.ok("Logged out successfully");
        } catch (Exception e) {
            log.error("Logout failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Logout failed: " + e.getMessage());
        }
    }


//    /**
//     * Change password (authenticated users)
//     * POST /api/auth/change-password
//     */
//    @PostMapping("/change-password")
//    public ResponseEntity<String> changePassword(
//            @RequestHeader("Authorization") String token,
//            @RequestBody ChangePasswordRequest request) {
//
//        log.info("Password change request for user ID: {}", request.getUserId());
//
//        try {
//            boolean success = authenticationService.changePassword(
//                    request.getUserId(),
//                    request.getCurrentPassword(),
//                    request.getNewPassword()
//            );
//
//            if (success) {
//                return ResponseEntity.ok("Password changed successfully");
//            } else {
//                return ResponseEntity.badRequest().body("Current password is incorrect");
//            }
//        } catch (Exception e) {
//            log.error("Password change failed: {}", e.getMessage());
//            return ResponseEntity.badRequest().body("Password change failed: " + e.getMessage());
//        }
//    }
}

