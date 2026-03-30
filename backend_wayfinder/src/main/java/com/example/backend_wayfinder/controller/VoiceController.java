package com.example.backend_wayfinder.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.example.backend_wayfinder.Dto.*;
import com.example.backend_wayfinder.entities.UserEntity;
import com.example.backend_wayfinder.repository.UserRepository;
import com.example.backend_wayfinder.service.AiAgentService;
import com.example.backend_wayfinder.service.ModalAiService;
import com.example.backend_wayfinder.service.VoiceAuthenticationService;
import com.example.backend_wayfinder.service.AccountService;
import com.example.backend_wayfinder.service.TransactionService;
import com.example.backend_wayfinder.service.ContactCacheService;
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
    private final VoiceAuthenticationService voiceAuthenticationService;
    private final AccountService accountService;
    private final TransactionService transactionService;
    private final ContactCacheService contactCacheService;

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
                    .message("Eroare în procesarea comenzii vocale: " + e.getMessage())
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

            // Step 2: Guard - user must have an enrolled voice fingerprint
            if (user.getVoiceFingerprint() == null || user.getVoiceFingerprint().isEmpty()) {
                log.warn("User {} has no enrolled voice fingerprint", request.getUserId());
                return ResponseEntity.ok(VoiceCommandResponse.builder()
                        .success(false)
                        .message("Nicio voce înregistrată. Te rog înregistrează-ți vocea mai întâi.")
                        .build());
            }

            // Step 3: Process voice (authenticate + transcribe + classify with fine-tuned model)
            ModalSecurityResponse securityResponse = modalAiService.processVoiceWithFineTunedIntent(
                    request.getAudioBase64(),
                    user.getVoiceFingerprint()
            );

            // Step 4: Check voice authentication result
            if (!"GRANTED".equals(securityResponse.getStatus())) {
                log.warn("Voice authentication failed for user {}: status={}, reason={}",
                        request.getUserId(), securityResponse.getStatus(), securityResponse.getReason());

                String message;
                if ("DENIED".equals(securityResponse.getStatus())) {
                    message = "Vocea nu a fost recunoscută. Te rog încearcă din nou.";
                } else {
                    message = "Serviciul AI nu este disponibil temporar. Te rog încearcă mai târziu.";
                }

                return ResponseEntity.ok(VoiceCommandResponse.builder()
                        .success(false)
                        .message(message)
                        .build());
            }

            // Step 5: Extract intent and entities from security response
            // Fine-tuned model uses key "intent", zero-shot fallback uses key "winner"
            Map<String, Object> intentData = securityResponse.getIntent();
            String intentStr = intentData != null
                    ? (String) intentData.getOrDefault("intent", intentData.get("winner"))
                    : null;

            @SuppressWarnings("unchecked")
            Map<String, Object> entitiesFromModel = intentData != null
                    ? (Map<String, Object>) intentData.get("entities")
                    : null;

            log.info("Voice authenticated successfully. Transcription: '{}', Intent: '{}', Entities: '{}', Model: '{}'",
                    securityResponse.getTranscription(), intentStr, entitiesFromModel,
                    intentData != null ? intentData.get("model") : "unknown");

            // Step 5b: Cache contacts from this request (if provided) so service layer can resolve beneficiaries
            if (request.getContacts() != null && !request.getContacts().isEmpty()) {
                log.debug("Caching {} contacts for user {}", request.getContacts().size(), request.getUserId());
                contactCacheService.storeContacts(request.getUserId(), request.getContacts());
            }

            // Step 6: Build VoiceCommandRequest for AI Agent processing
            VoiceCommandRequest commandRequest = VoiceCommandRequest.builder()
                    .userId(request.getUserId())
                    .voiceCommandTranscript(securityResponse.getTranscription())
                    .aiMode(request.getAiMode())
                    .voiceFingerprint(user.getVoiceFingerprint())
                    .precomputedIntent(intentStr)
                    .precomputedEntities(entitiesFromModel)
                    .contacts(request.getContacts())
                    .build();

            // Step 7: Process the command (GUIDE or AGENT mode)
            VoiceCommandResponse response = aiAgentService.processVoiceCommand(commandRequest);

            log.info("Voice command processed successfully. Success: {}, Action performed: {}",
                    response.isSuccess(), response.isActionPerformed());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Voice processing failed for user {}: {}", request.getUserId(), e.getMessage(), e);

            return ResponseEntity.ok(VoiceCommandResponse.builder()
                    .success(false)
                    .message("Eroare în procesarea vocii: " + e.getMessage())
                    .build());
        }
    }

    /**
     * Confirm or cancel a pending voice transfer
     * POST /api/voice/confirm-transfer
     *
     * Called after the frontend receives a pendingConfirmation=true response from /api/voice/process.
     * The frontend MUST extract the description from response.extractedEntities.description
     * and pass it back in this request.
     *
     * Request body:
     * {
     *   "userId": "uuid",
     *   "confirmed": true/false,
     *   "targetAccountNumber": "RO49...",
     *   "amount": 100,
     *   "currency": "RON",
     *   "description": "extracted from response.extractedEntities.description",
     *   "transferPin": "1234"
     * }
     */
    @PostMapping("/confirm-transfer")
    public ResponseEntity<TransactionDto> confirmTransfer(@Valid @RequestBody ConfirmTransferRequest request) {
        log.info("Transfer confirmation received for user {}: confirmed={}, description='{}'",
                request.getUserId(), request.isConfirmed(), request.getDescription());

        if (!request.isConfirmed()) {
            log.info("Transfer cancelled by user {}", request.getUserId());
            return ResponseEntity.badRequest().body(null);
        }

        // Validate target account is provided
        if (request.getTargetAccountNumber() == null || request.getTargetAccountNumber().isBlank()) {
            log.error("Transfer target account is null or blank for user {}", request.getUserId());
            throw new IllegalArgumentException(
                "Destinatarul nu are un cont Wayfinder. Te rog introdu IBAN-ul pentru transfer extern."
            );
        }

        // Get user's active account
        AccountDto sourceAccount = accountService.getAccountsByUserId(request.getUserId())
                .stream().filter(AccountDto::getIsActive).findFirst()
                .orElseThrow(() -> new RuntimeException("No active account found for user"));

        // Process description
        String description = request.getDescription();
        log.debug("Processing description - request value: '{}'", description);
        if (description == null || description.isBlank() || description.trim().equalsIgnoreCase("null")) {
            description = "Voice Transfer Confirmed";
            log.info("Using default description as none was provided");
        } else {
            description = "Voice Transfer Confirmed: " + description;
            log.info("Using description from request: '{}'", description);
        }

        // Create and execute transaction
        CreateTransactionRequest transactionRequest = CreateTransactionRequest.builder()
                .sourceAccountId(sourceAccount.getAccountId())
                .destinationAccountNumber(request.getTargetAccountNumber())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .description(description)
                .initiatedBy("AI_CONFIRMED")
                .build();

        TransactionDto transaction = transactionService.createTransaction(transactionRequest);
        log.info("Transaction {} created successfully for user {}", transaction.getId(), request.getUserId());

        return ResponseEntity.ok(transaction);
    }

    @PostMapping("/confirm-plata-facturi")
    public ResponseEntity<TransactionDto> confirmPlataFacturi(@Valid @RequestBody ConfirmPlataFacturiRequest request) {
        log.info("Bill payment confirmation received for user {}: confirmed={}, description='{}'",
                request.getUserId(), request.isConfirmed(), request.getDescription());

        // ✅ EXPLICIT NULL CHECK - Amount MUST be provided
        if (request.getAmount() == null) {
            log.error("CRITICAL: Amount is null in ConfirmPlataFacturiRequest");
            log.error("Request body: userId={}, confirmed={}, targetAccount={}, currency={}, amount={}",
                    request.getUserId(), request.isConfirmed(), request.getTargetAccountNumber(),
                    request.getCurrency(), request.getAmount());
            throw new IllegalArgumentException("Amount is required for bill payment. Please provide the bill amount.");
        }

        if (!request.isConfirmed()) {
            log.info("Bill payment cancelled by user {}", request.getUserId());
            return ResponseEntity.badRequest().body(null);
        }

        AccountDto sourceAccount = accountService.getAccountsByUserId(request.getUserId())
                .stream().filter(AccountDto::getIsActive).findFirst()
                .orElseThrow(() -> new RuntimeException("No active account found for user"));

        String description = request.getDescription();
        log.debug("Processing description - request value: '{}'", description);
        if (description == null || description.isBlank() || description.trim().equalsIgnoreCase("null")) {
            description = "Plata Factura Confirmata";
            log.info("Using default description as none was provided");
        } else {
            description = "Plata Factura Confirmata: " + description;
            log.info("Using description from request: '{}'", description);
        }

        log.info("✅ Creating bill payment transaction: amount={}, targetAccount={}",
                request.getAmount(), request.getTargetAccountNumber());

        CreateTransactionRequest transactionRequest = CreateTransactionRequest.builder()
                .sourceAccountId(sourceAccount.getAccountId())
                .destinationAccountNumber(request.getTargetAccountNumber())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .description(description)
                .initiatedBy("AI_CONFIRMED")
                .build();

        TransactionDto transaction = transactionService.createTransaction(transactionRequest);
        log.info("Transaction {} created successfully for user {}", transaction.getId(), request.getUserId());

        return ResponseEntity.ok(transaction);
    }

    /**
     * Upload audio file for fingerprint extraction
     * POST /api/voice/upload
     *
     * This endpoint extracts a 512-dimensional voice fingerprint from audio
     * using the WavLM model hosted on Modal.


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
                    .message("Datele audio sunt obligatorii")
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
                    .message("Amprenta vocală extrasă cu succes")
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
                    .message("Eroare la extragerea amprentei: " + e.getMessage())
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

            // Step 2: Guard - prevent re-enrollment if voice is already registered
            if (user.getVoiceFingerprint() != null && !user.getVoiceFingerprint().isEmpty()) {
                log.warn("User {} already has a voice fingerprint enrolled", request.getUserId());
                return ResponseEntity.ok(VoiceEnrollmentResponse.builder()
                        .success(false)
                        .message("Voce deja înregistrată. Contactează suportul pentru a reseta profilul vocal.")
                        .build());
            }

            // Step 3: Extract voice fingerprint
            log.info("Extracting voice fingerprint from enrollment audio...");
            List<Double> fingerprint = modalAiService.extractVoiceFingerprint(request.getAudioBase64());

            if (fingerprint.size() != 512) {
                log.error("Invalid fingerprint dimension: {} (expected 512)", fingerprint.size());
                return ResponseEntity.ok(VoiceEnrollmentResponse.builder()
                        .success(false)
                        .message("Dimensiune amprentă nevalidă: " + fingerprint.size() + " (așteptat 512)")
                        .build());
            }

            // Step 4: Save fingerprint and enable voice auth
            user.setVoiceFingerprint(new ArrayList<>(fingerprint));
            user.setIsVoiceAuthEnabled(true);
            userRepository.save(user);

            log.info("Voice enrollment successful for user ID: {}. Fingerprint dimension: {}",
                    request.getUserId(), fingerprint.size());

            return ResponseEntity.ok(VoiceEnrollmentResponse.builder()
                    .success(true)
                    .message("Autentificarea vocală activată cu succes")
                    .fingerprintDimension(fingerprint.size())
                    .build());

        } catch (Exception e) {
            log.error("Voice enrollment failed for user {}: {}", request.getUserId(), e.getMessage(), e);

            return ResponseEntity.ok(VoiceEnrollmentResponse.builder()
                    .success(false)
                    .message("Eroare la înregistrarea vocii: " + e.getMessage())
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
            // Load user and their stored reference fingerprint
            UserEntity user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found: " + request.getUserId()));

            if (user.getVoiceFingerprint() == null || user.getVoiceFingerprint().isEmpty()) {
                return ResponseEntity.ok(VoiceAuthTestResponse.builder()
                        .success(false)
                        .similarity(0.0)
                        .threshold(0.85)
                        .message("Utilizatorul nu are o amprentă vocală înregistrată. Te rog înregistrează-ți vocea mai întâi.")
                        .build());
            }

            if (request.getVoiceFingerprint() == null || request.getVoiceFingerprint().isEmpty()) {
                return ResponseEntity.ok(VoiceAuthTestResponse.builder()
                        .success(false)
                        .similarity(0.0)
                        .threshold(0.85)
                        .message("Nicio amprentă vocală furnizată în cerere.")
                        .build());
            }

            double similarity = voiceAuthenticationService.getSimilarityScore(
                    request.getVoiceFingerprint(),
                    user.getVoiceFingerprint()
            );

            boolean isMatch = voiceAuthenticationService.verifyVoice(
                    request.getVoiceFingerprint(),
                    user.getVoiceFingerprint()
            );

            log.info("Voice auth test for user {}: similarity={}, match={}",
                    request.getUserId(), similarity, isMatch);

            return ResponseEntity.ok(VoiceAuthTestResponse.builder()
                    .success(isMatch)
                    .similarity(similarity)
                    .threshold(0.85)
                    .message(isMatch ? "Autentificarea vocală reușită" : "Autentificarea vocală eșuată: similaritate sub prag")
                    .build());
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

