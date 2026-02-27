package com.example.backend_wayfinder.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.example.backend_wayfinder.Dto.*;
import com.example.backend_wayfinder.entities.UserEntity;
import com.example.backend_wayfinder.enums.AiMode;
import com.example.backend_wayfinder.enums.Intent;
import com.example.backend_wayfinder.repository.UserRepository;
import com.example.backend_wayfinder.service.AiAgentService;
import com.example.backend_wayfinder.service.ModalAiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/voice")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class VoiceController {

    private final AiAgentService aiAgentService;
    private final ModalAiService modalAiService;
    private final UserRepository userRepository;

    /**
     * FOR TESTING PURPOSES ONLY
     * Process voice commands with text transcript (no audio)
     * POST /api/voice/intent
     *
     * Use this when you already have the transcribed text.
     * For complete audio processing, use /api/voice/process instead.
     */
    @PostMapping("/intent")
    public ResponseEntity<VoiceCommandResponse> processVoiceIntent(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody VoiceCommandRequest request) {

        log.info("Processing voice command for user ID: {} in mode: {}",
                request.getUserId(), request.getAiMode());

        try {
            VoiceCommandResponse response = aiAgentService.processVoiceCommand(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Voice command processing failed: {}", e.getMessage());

            return ResponseEntity.ok(VoiceCommandResponse.builder()
                    .success(false)
                    .message("Failed to process voice command: " + e.getMessage())
                    .build());
        }
    }

    /**
     * COMPLETE VOICE PROCESSING PIPELINE
     * POST /api/voice/process
     *
     * Handles the full flow:
     * 1. Voice authentication (fingerprint verification)
     * 2. Audio transcription to Romanian text
     * 3. Intent classification with fine-tuned model
     * 4. Action execution (if AGENT mode)
     *
     * Request body:
     * {
     *   "userId": "uuid",
     *   "audioBase64": "base64_encoded_audio",
     *   "aiMode": "AGENT" or "GUIDE"
     * }
     */
    @PostMapping("/process")
    public ResponseEntity<VoiceCommandResponse> processVoiceAudio(
            @RequestHeader(value = "Authorization", required = false) String token,
            @Valid @RequestBody ProcessVoiceRequest request) {

        log.info("Processing voice audio for user ID: {} in mode: {}",
                request.getUserId(), request.getAiMode());

        try {
            // Step 1: Get user and their stored voice fingerprint
            UserEntity user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + request.getUserId()));

            // Step 2: Process voice (authenticate + transcribe + classify with fine-tuned model)
            ModalSecurityResponse securityResponse = modalAiService.processVoiceWithFineTunedIntent(
                    request.getAudioBase64(),
                    user.getVoiceFingerprint()
            );

            // Step 3: Check voice authentication result
            if (!"GRANTED".equals(securityResponse.getStatus())) {
                log.warn("Voice authentication failed for user {}: {}",
                        request.getUserId(), securityResponse.getReason());

                return ResponseEntity.ok(VoiceCommandResponse.builder()
                        .success(false)
                        .message("Voice authentication failed: " + securityResponse.getReason())
                        .build());
            }

            // Step 4: Extract intent from security response
            Map<String, Object> intentData = securityResponse.getIntent();
            String intentStr = (String) intentData.get("winner");

            log.info("Voice authenticated successfully. Transcription: '{}', Intent: '{}'",
                    securityResponse.getTranscription(), intentStr);

            // Step 5: Build VoiceCommandRequest for AI Agent processing
            VoiceCommandRequest commandRequest = VoiceCommandRequest.builder()
                    .userId(request.getUserId())
                    .voiceCommandTranscript(securityResponse.getTranscription())
                    .aiMode(request.getAiMode())
                    .voiceFingerprint(user.getVoiceFingerprint())
                    .build();

            // Step 6: Process the command (GUIDE or AGENT mode)
            VoiceCommandResponse response = aiAgentService.processVoiceCommand(commandRequest);

            log.info("Voice command processed successfully. Success: {}, Action performed: {}",
                    response.isSuccess(), response.isActionPerformed());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Voice processing failed for user {}: {}", request.getUserId(), e.getMessage(), e);

            return ResponseEntity.ok(VoiceCommandResponse.builder()
                    .success(false)
                    .message("Failed to process voice: " + e.getMessage())
                    .build());
        }
    }

    /**
     * Upload audio file for fingerprint extraction
     * POST /api/voice/upload
     *
     * This endpoint extracts a 512-dimensional voice fingerprint from audio
     * using the WavLM model hosted on Modal.
     *
     * Request body: Base64 encoded audio (M4A, WAV, MP3, etc.)
     *
     * Response:
     * {
     *   "success": true,
     *   "fingerprint": [0.123, 0.456, ...], // 512 dimensions
     *   "audioSize": 123456,
     *   "message": "Fingerprint extracted successfully"
     * }
     */
    @PostMapping("/upload")
    public ResponseEntity<AudioUploadResponse> uploadAudio(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestBody Map<String, String> requestBody) {

        String audioBase64 = requestBody.get("audioBase64");

        if (audioBase64 == null || audioBase64.isEmpty()) {
            log.error("Audio data is missing or empty");
            return ResponseEntity.badRequest().body(
                AudioUploadResponse.builder()
                    .success(false)
                    .message("Audio data is required")
                    .audioSize(0)
                    .build()
            );
        }

        log.info("Processing audio upload for fingerprint extraction, base64 length: {}", audioBase64.length());

        try {
            // Extract voice fingerprint using Modal WavLM endpoint
            List<Double> fingerprint = modalAiService.extractVoiceFingerprint(audioBase64);

            AudioUploadResponse response = AudioUploadResponse.builder()
                    .success(true)
                    .message("Voice fingerprint extracted successfully")
                    .audioSize(audioBase64.length())
                    .fingerprint(fingerprint)
                    .build();

            log.info("Voice fingerprint extracted successfully. Dimension: {}", fingerprint.size());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Audio fingerprint extraction failed: {}", e.getMessage(), e);

            return ResponseEntity.ok(
                AudioUploadResponse.builder()
                    .success(false)
                    .message("Failed to extract fingerprint: " + e.getMessage())
                    .audioSize(audioBase64.length())
                    .build()
            );
        }
    }

    /**
     * Enroll user voice for authentication
     * POST /api/voice/enroll
     *
     * This endpoint:
     * 1. Extracts voice fingerprint from audio
     * 2. Saves it to the user's profile
     * 3. Enables voice authentication
     *
     * Request body:
     * {
     *   "userId": "uuid",
     *   "audioBase64": "base64_encoded_audio"
     * }
     */
    @PostMapping("/enroll")
    public ResponseEntity<VoiceEnrollmentResponse> enrollVoice(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestBody VoiceEnrollmentRequest request) {

        log.info("Enrolling voice for user ID: {}", request.getUserId());

        try {
            // Step 1: Get user
            UserEntity user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + request.getUserId()));

            // Step 2: Extract voice fingerprint
            log.info("Extracting voice fingerprint from enrollment audio...");
            List<Double> fingerprint = modalAiService.extractVoiceFingerprint(request.getAudioBase64());

            if (fingerprint.size() != 512) {
                log.error("Invalid fingerprint dimension: {} (expected 512)", fingerprint.size());
                return ResponseEntity.ok(VoiceEnrollmentResponse.builder()
                        .success(false)
                        .message("Invalid fingerprint dimension: " + fingerprint.size() + " (expected 512)")
                        .build());
            }

            // Step 3: Save fingerprint and enable voice auth
            user.setVoiceFingerprint(new ArrayList<>(fingerprint));
            user.setIsVoiceAuthEnabled(true);
            userRepository.save(user);

            log.info("Voice enrollment successful for user ID: {}. Fingerprint dimension: {}",
                    request.getUserId(), fingerprint.size());

            return ResponseEntity.ok(VoiceEnrollmentResponse.builder()
                    .success(true)
                    .message("Voice authentication enabled successfully")
                    .fingerprintDimension(fingerprint.size())
                    .build());

        } catch (Exception e) {
            log.error("Voice enrollment failed for user {}: {}", request.getUserId(), e.getMessage(), e);

            return ResponseEntity.ok(VoiceEnrollmentResponse.builder()
                    .success(false)
                    .message("Voice enrollment failed: " + e.getMessage())
                    .build());
        }
    }

    /**
     * Test voice authentication
     * POST /api/voice/test-auth
     */
    @PostMapping("/test-auth")
    public ResponseEntity<VoiceAuthTestResponse> testVoiceAuth(
            @RequestHeader("Authorization") String token,
            @RequestBody VoiceAuthTestRequest request) {

        log.info("Testing voice authentication for user ID: {}", request.getUserId());

        try {
            // TODO: Implement voice auth testing

            VoiceAuthTestResponse response = VoiceAuthTestResponse.builder()
                    .success(true)
                    .similarity(0.85)
                    .threshold(0.85)
                    .message("Voice authentication test successful")
                    .build();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Voice auth test failed: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    // Helper DTOs
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class AudioUploadResponse {
        private boolean success;
        private String message;
        private int audioSize;
        private java.util.List<Double> fingerprint; // 512-dim vector
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class VoiceAuthTestRequest {
        private UUID userId;
        private java.util.List<Double> voiceFingerprint;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class VoiceAuthTestResponse {
        private boolean success;
        private double similarity;
        private double threshold;
        private String message;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class VoiceEnrollmentRequest {
        private UUID userId;
        private String audioBase64;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class VoiceEnrollmentResponse {
        private boolean success;
        private String message;
        private Integer fingerprintDimension;
    }
}

