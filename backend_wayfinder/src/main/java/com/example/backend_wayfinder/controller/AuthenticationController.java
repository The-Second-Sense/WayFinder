package com.example.backend_wayfinder.controller;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.example.backend_wayfinder.Dto.*;
import com.example.backend_wayfinder.entities.UserEntity;
import com.example.backend_wayfinder.repository.UserRepository;
import com.example.backend_wayfinder.service.AuthenticationService;
import com.example.backend_wayfinder.service.ModalAiService;
import com.example.backend_wayfinder.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final UserService userService;
    private final ModalAiService modalAiService;
    private final UserRepository userRepository;

    /**
     * User registration (Create account)
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@Valid @RequestBody CreateUserRequest request) {
        log.info("Registration request for email: {}", request.getEmail());

        try {
            AuthenticationResponse response = authenticationService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            log.error("Registration failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(AuthenticationResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build());
        } catch (Exception e) {
            log.error("Registration failed unexpectedly: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(AuthenticationResponse.builder()
                            .success(false)
                            .message("Registration failed")
                            .build());
        }
    }

    /**
     * Upload voice samples for biometric setup (JSON format)
     * POST /api/auth/voice-reg
     *
     * Accepts JSON with:
     * {
     *   "userId": "uuid-string",
     *   "audioBase64": "base64-encoded-audio"
     * }
     */
    @PostMapping(value = "/voice-reg", consumes = "application/json")
    public ResponseEntity<UserDto> registerVoiceSampleJson(@RequestBody Map<String, String> request) {
        log.info("Voice registration request received (JSON)");

        String userId = request.get("userId");
        String audioBase64 = request.get("audioBase64");

        log.debug("Received JSON - userId: {}, audioBase64: {}",
                userId, audioBase64 != null ? "present (length: " + audioBase64.length() + ")" : "null");

        return processVoiceRegistration(userId, audioBase64);
    }

    /**
     * Upload voice samples for biometric setup (Multipart format)
     * POST /api/auth/voice-reg
     *
     * Accepts multipart/form-data with:
     * - userId: UUID string (form field)
     * - phraseId: Phrase identifier (form field)
     * - audioFile: M4A audio file (file part)
     */
    @PostMapping(value = "/voice-reg", consumes = "multipart/form-data")
    public ResponseEntity<UserDto> registerVoiceSampleMultipart(
            @RequestParam(value = "userId", required = false) String userId,
            @RequestParam(value = "phraseId", required = false) String phraseId,
            @RequestPart(value = "audioFile", required = false) MultipartFile audioFile) {

        log.info("Voice registration request received (Multipart/FormData)");
        log.info("Received fields - userId: '{}', phraseId: '{}', audioFile: {}",
                userId,
                phraseId,
                audioFile != null ? audioFile.getOriginalFilename() + " (" + audioFile.getSize() + " bytes)" : "null");

        if (userId == null || userId.trim().isEmpty()) {
            log.error("Missing or empty userId parameter");
            return ResponseEntity.badRequest()
                    .body(UserDto.builder().build());
        }

        if (audioFile == null || audioFile.isEmpty()) {
            log.error("No audio file provided");
            return ResponseEntity.badRequest()
                    .body(UserDto.builder().build());
        }

        try {
            log.info("Processing uploaded audio file: {} ({} bytes)",
                    audioFile.getOriginalFilename(), audioFile.getSize());
            byte[] audioBytes = audioFile.getBytes();
            String base64Audio = Base64.getEncoder().encodeToString(audioBytes);

            log.info("Phrase ID: {}", phraseId);
            return processVoiceRegistration(userId, base64Audio);
        } catch (Exception e) {
            log.error("Failed to process multipart audio: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(UserDto.builder().build());
        }
    }

    /**
     * Common method to process voice registration
     */
    private ResponseEntity<UserDto> processVoiceRegistration(String userId, String base64Audio) {
       if (userId == null || userId.trim().isEmpty()) {
            log.error("Missing or empty userId");
            return ResponseEntity.badRequest().body(UserDto.builder().build());
        }

        if (base64Audio == null || base64Audio.isEmpty()) {
            log.error("Missing or empty audio data");
            return ResponseEntity.badRequest().body(UserDto.builder().build());
        }

        UUID userUuid;
        try {
            userUuid = UUID.fromString(userId.trim());
        } catch (IllegalArgumentException e) {
            log.error("Invalid userId format: '{}' - {}", userId, e.getMessage());
            return ResponseEntity.badRequest().body(UserDto.builder().build());
        }

        log.info("Voice registration for user ID: {}", userUuid);

        try {
            // Extract voice fingerprint using Modal WavLM model
            // Note: First request may take longer due to Modal cold start (~30-40s)
            log.info("Extracting voice fingerprint from audio (base64 length: {})...", base64Audio.length());
            log.info("Note: First-time extraction may take 30-60 seconds due to model initialization");

            List<Double> fingerprint = modalAiService.extractVoiceFingerprint(base64Audio);

            if (fingerprint.size() != 512) {
                log.error("Invalid fingerprint size: {} (expected 512)", fingerprint.size());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(UserDto.builder().build());
            }

            // Get user and save fingerprint
            UserEntity user = userRepository.findById(userUuid).orElse(null);
            if (user == null) {
                log.error("User not found: {}", userUuid);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(UserDto.builder().build());
            }

            user.setVoiceFingerprint(new ArrayList<>(fingerprint));
            user.setIsVoiceAuthEnabled(true);
            userRepository.save(user);

            log.info("Voice fingerprint registered successfully for user: {}", userUuid);

            // Map to DTO
            UserDto userDto = UserDto.builder()
                    .userId(user.getUserId())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .phoneNumber(user.getPhoneNumber())
                    .isVoiceAuthEnabled(user.getIsVoiceAuthEnabled())
                    .createdAt(user.getCreatedAt())
                    .lastLogin(user.getLastLogin())
                    .build();

            return ResponseEntity.ok(userDto);
        } catch (org.springframework.web.client.ResourceAccessException e) {
            // Network timeout - this is expected on first Modal cold start
            if (e.getMessage().contains("Read timed out")) {
                log.warn("Voice fingerprint extraction timed out (Modal cold start). Service will auto-retry.");
                return ResponseEntity.status(HttpStatus.REQUEST_TIMEOUT)
                        .body(UserDto.builder().build());
            }
            log.error("Network error during voice registration: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(UserDto.builder().build());
        } catch (Exception e) {
            log.error("Voice registration failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(UserDto.builder().build());
        }
    }

    /**
     * Authenticate user (Login)
     * POST /api/auth/login
     *
     * Accepts JSON with:
     * {
     *   "phone": "user-phone-number",
     *   "password": "user-password"
     * }
     */
    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login request for phone: {}", request.getPhone());

        try {
            // Phone/password login
            AuthenticationResponse response = authenticationService.login(request.getPhone(), request.getPassword());
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

    /**
     * Voice-based login
     * POST /api/auth/voice-login
     *
     * Accepts multipart/form-data with:
     * - email: User's email address
     * - audioFile: M4A audio file for voice authentication
     */
    @PostMapping(value = "/voice-login", consumes = "multipart/form-data")
    public ResponseEntity<AuthenticationResponse> voiceLogin(
            @RequestParam(value = "email") String email,
            @RequestPart(value = "audioFile") MultipartFile audioFile) {

        log.info("Voice login request for email: {}", email);

        if (email == null || email.trim().isEmpty()) {
            log.error("Missing email parameter");
            return ResponseEntity.badRequest()
                    .body(AuthenticationResponse.builder()
                            .success(false)
                            .message("Email is required")
                            .build());
        }

        if (audioFile == null || audioFile.isEmpty()) {
            log.error("No audio file provided");
            return ResponseEntity.badRequest()
                    .body(AuthenticationResponse.builder()
                            .success(false)
                            .message("Audio file is required")
                            .build());
        }

        try {
            log.info("Processing voice login audio file: {} ({} bytes)",
                    audioFile.getOriginalFilename(), audioFile.getSize());

            byte[] audioBytes = audioFile.getBytes();
            AuthenticationResponse response = authenticationService.voiceLogin(audioBytes, email);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Voice login failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthenticationResponse.builder()
                            .success(false)
                            .message("Voice login failed: " + e.getMessage())
                            .build());
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

    /**
     * Set transfer PIN for a user
     * POST /api/auth/set-transfer-pin
     */
    @PostMapping("/set-transfer-pin")
    public ResponseEntity<Map<String, Object>> setTransferPin(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, String> request) {

        String userIdStr = request.get("userId");
        String pin = request.get("pin");

        log.info("Transfer PIN setup request for user: {}", userIdStr);

        if (userIdStr == null || userIdStr.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "User ID required"));
        }

        if (pin == null || pin.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "PIN required"));
        }

        if (!pin.matches("\\d{4}")) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "PIN must be exactly 4 digits"));
        }

        try {
            UUID userId = UUID.fromString(userIdStr);
            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            user.setTransferPin(pin);
            userRepository.save(user);

            log.info("Transfer PIN set successfully for user {}", userId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Transfer PIN set successfully"));

        } catch (IllegalArgumentException e) {
            log.error("Invalid user ID format: {}", userIdStr);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid user ID format"));
        } catch (Exception e) {
            log.error("Failed to set transfer PIN: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}

