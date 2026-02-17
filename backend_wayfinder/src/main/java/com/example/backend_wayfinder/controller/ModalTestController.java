package com.example.backend_wayfinder.controller;

import com.example.backend_wayfinder.Dto.DeBertaClassificationResponse;
import com.example.backend_wayfinder.Dto.IntentAgentResponse;
import com.example.backend_wayfinder.Dto.ModalSecurityResponse;
import com.example.backend_wayfinder.service.ModalAiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/modal-test")
@RequiredArgsConstructor
public class ModalTestController {

    private final ModalAiService modalAiService;

    /**
     * Test DeBERTa classification with Romanian text
     * POST /api/modal-test/classify
     * Body: { "text": "Vreau sa fac un transfer" }
     */
    @PostMapping("/classify")
    public ResponseEntity<DeBertaClassificationResponse> testClassification(
            @RequestBody Map<String, String> request
    ) {
        String text = request.get("text");
        log.info("Testing classification for: {}", text);

        DeBertaClassificationResponse response = modalAiService.classifyIntent(text);
        return ResponseEntity.ok(response);
    }

    /**
     * Test voice verification with audio file
     * POST /api/modal-test/verify-voice
     * FormData:
     *   - audioFile: audio file (m4a, mp3, wav)
     *   - fingerprint: comma-separated list of 512 doubles
     */
    @PostMapping("/verify-voice")
    public ResponseEntity<ModalSecurityResponse> testVoiceVerification(
            @RequestParam("audioFile") MultipartFile audioFile,
            @RequestParam("fingerprint") String fingerprintStr
    ) {
        try {
            // Convert audio to base64
            byte[] audioBytes = audioFile.getBytes();
            String audioBase64 = Base64.getEncoder().encodeToString(audioBytes);

            // Parse fingerprint
            String[] parts = fingerprintStr.split(",");
            List<Double> fingerprint = new java.util.ArrayList<>();
            for (String part : parts) {
                fingerprint.add(Double.parseDouble(part.trim()));
            }

            log.info("Testing voice verification with {} byte audio and {} dim fingerprint",
                audioBytes.length, fingerprint.size());

            ModalSecurityResponse response = modalAiService.verifyVoiceAndTranscribe(
                audioBase64,
                fingerprint
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error in voice verification test: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Simple test endpoint to verify Modal is reachable
     * POST /api/modal-test/classify-simple
     * No body needed - uses a hardcoded Romanian test sentence
     */
    @PostMapping("/classify-simple")
    public ResponseEntity<DeBertaClassificationResponse> testClassificationSimple() {
        String testText = "Vreau sa fac un transfer de bani";
        log.info("Testing with simple text: {}", testText);

        DeBertaClassificationResponse response = modalAiService.classifyIntent(testText);
        return ResponseEntity.ok(response);
    }

    /**
     * Test fine-tuned intent agent (BEST MODEL)
     * POST /api/modal-test/classify-finetuned
     * Body: { "text": "Transferă 100 RON către Andrei" }
     */
    @PostMapping("/classify-finetuned")
    public ResponseEntity<Map<String, Object>> testFineTunedModel(
            @RequestBody Map<String, String> request
    ) {
        String text = request.get("text");
        log.info("Testing fine-tuned model for: {}", text);

        Object response = modalAiService.classifyIntentWithFallback(text);

        Map<String, Object> result = new HashMap<>();
        result.put("text", text);

        if (response instanceof IntentAgentResponse) {
            IntentAgentResponse intentResponse = (IntentAgentResponse) response;
            result.put("intent", intentResponse.getIntent());
            result.put("entities", intentResponse.getEntities());
            result.put("model_used", "fine-tuned");
        } else if (response instanceof DeBertaClassificationResponse) {
            DeBertaClassificationResponse debertaResponse = (DeBertaClassificationResponse) response;
            result.put("winner", debertaResponse.getWinner());
            result.put("score", debertaResponse.getScore());
            result.put("all_scores", debertaResponse.getAll_scores());
            result.put("model_used", "zero-shot-fallback");
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Test with fallback - simulates fine-tuned failure
     * POST /api/modal-test/test-fallback
     */
    @PostMapping("/test-fallback")
    public ResponseEntity<Map<String, Object>> testFallbackMechanism(
            @RequestBody Map<String, String> request
    ) {
        String text = request.get("text");
        log.info("Testing fallback mechanism for: {}", text);

        Object response = modalAiService.classifyIntentWithFallback(text);

        Map<String, Object> result = new HashMap<>();
        result.put("text", text);
        result.put("message", "If you see this, fallback mechanism is working!");

        if (response instanceof IntentAgentResponse) {
            IntentAgentResponse intentResponse = (IntentAgentResponse) response;
            result.put("intent", intentResponse.getIntent());
            result.put("entities", intentResponse.getEntities());
            result.put("model_used", "fine-tuned");
        } else if (response instanceof DeBertaClassificationResponse) {
            DeBertaClassificationResponse debertaResponse = (DeBertaClassificationResponse) response;
            result.put("winner", debertaResponse.getWinner());
            result.put("score", debertaResponse.getScore());
            result.put("all_scores", debertaResponse.getAll_scores());
            result.put("model_used", "zero-shot-fallback");
        }

        return ResponseEntity.ok(result);
    }
}

