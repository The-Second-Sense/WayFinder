package com.example.backend_wayfinder.controller;

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
     * Upload audio file for processing
     * POST /api/voice/upload
     */
    @PostMapping("/upload")
    public ResponseEntity<AudioUploadResponse> uploadAudio(
            @RequestHeader("Authorization") String token,
            @RequestBody byte[] audioBlob) {

        log.info("Processing audio upload, size: {} bytes", audioBlob.length);

        try {
            // TODO: Send audio to Modal WavLM endpoint to extract fingerprint
            // For now, return placeholder response

            AudioUploadResponse response = AudioUploadResponse.builder()
                    .success(true)
                    .message("Audio uploaded successfully. Integration with WavLM pending.")
                    .audioSize(audioBlob.length)
                    .build();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Audio upload failed: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
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
}

