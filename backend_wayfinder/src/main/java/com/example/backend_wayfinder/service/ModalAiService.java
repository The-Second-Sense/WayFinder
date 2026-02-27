package com.example.backend_wayfinder.service;

import com.example.backend_wayfinder.Dto.*;
import com.example.backend_wayfinder.exception.AiServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class ModalAiService {

    private final RestTemplate restTemplate;

    @Value("${modal.security.url}")
    private String modalSecurityUrl;

    @Value("${modal.intent.url}")
    private String modalIntentUrl;

    @Value("${modal.deberta.url}")
    private String modalDebertaUrl;

    @Value("${modal.fingerprint.url:}")
    private String modalFingerprintUrl;

    @Value("${modal.ai.retry.max-attempts:3}")
    private int maxRetryAttempts;

    @Value("${modal.ai.retry.initial-delay-ms:1000}")
    private long initialRetryDelay;

    @Value("${modal.ai.retry.max-delay-ms:5000}")
    private long maxRetryDelay;

    private static final List<String> DEFAULT_LABELS = Arrays.asList(
        "TRANSFER", "SOLD", "TRANZACTII", "ADAUGA_BENEFICIAR", "PLATA_FACTURI", "ALTELE"
    );

    // Circuit breaker state for each service
    private final Map<String, ServiceHealthState> serviceHealth = new HashMap<>();

    private static class ServiceHealthState {
        int consecutiveFailures = 0;
        Instant lastFailureTime = null;
        boolean isCircuitOpen = false;
        Instant circuitOpenedAt = null;
        static final int FAILURE_THRESHOLD = 5;
        static final Duration CIRCUIT_RESET_DURATION = Duration.ofMinutes(2);
    }

    /**
     * Verify voice fingerprint and transcribe audio with retry logic
     */
    public ModalSecurityResponse verifyVoiceAndTranscribe(
        String audioBase64,
        List<Double> referenceFingerprint
    ) {
        ModalSecurityRequest request = ModalSecurityRequest.builder()
            .current_voice_base64(audioBase64)
            .reference_fingerprint(referenceFingerprint)
            .deberta_url(modalDebertaUrl)
            .build();

        log.info("Sending voice verification request to Modal Security Agent");

        return executeWithRetry(
            "SecurityAgent",
            modalSecurityUrl,
            () -> {
                ModalSecurityResponse response = restTemplate.postForObject(
                    modalSecurityUrl,
                    request,
                    ModalSecurityResponse.class
                );

                if (response == null) {
                    throw new AiServiceException(
                        "SecurityAgent",
                        "Received null response from security agent",
                        false
                    );
                }

                log.info("Voice verification response: status={}, score={}",
                    response.getStatus(), response.getScore());
                return response;
            }
        );
    }

    /**
     * Complete voice processing pipeline with fine-tuned intent model and error handling
     */
    public ModalSecurityResponse processVoiceWithFineTunedIntent(
        String audioBase64,
        List<Double> referenceFingerprint
    ) {
        log.info("Processing voice with fine-tuned intent model");

        try {
            // Step 1 & 2: Verify voice and transcribe
            ModalSecurityResponse securityResponse = verifyVoiceAndTranscribe(
                audioBase64,
                referenceFingerprint
            );

            // If voice authentication failed, return immediately
            if (!"GRANTED".equals(securityResponse.getStatus())) {
                log.warn("Voice authentication failed: {}", securityResponse.getReason());
                return securityResponse;
            }

            // Step 3: Re-classify the transcription with fine-tuned model
            String transcription = securityResponse.getTranscription();
            log.info("Transcription successful: '{}'. Re-classifying with fine-tuned model...", transcription);

            try {
                Object intentResult = classifyIntentWithFallback(transcription);

                // Replace the zero-shot intent with fine-tuned intent
                Map<String, Object> intentData = new HashMap<>();

                if (intentResult instanceof IntentAgentResponse) {
                    // Fine-tuned model response
                    IntentAgentResponse intentResponse = (IntentAgentResponse) intentResult;
                    intentData.put("intent", intentResponse.getIntent());
                    intentData.put("entities", intentResponse.getEntities());
                    intentData.put("model", "fine-tuned");
                    log.info("Fine-tuned intent classification: {} with entities: {}",
                        intentResponse.getIntent(), intentResponse.getEntities());
                } else if (intentResult instanceof DeBertaClassificationResponse) {
                    // Zero-shot fallback response
                    DeBertaClassificationResponse debertaResponse = (DeBertaClassificationResponse) intentResult;
                    intentData.put("winner", debertaResponse.getWinner());
                    intentData.put("score", debertaResponse.getScore());
                    intentData.put("all_scores", debertaResponse.getAll_scores());
                    intentData.put("model", "zero-shot-fallback");
                    log.info("Zero-shot fallback intent classification: {}", debertaResponse.getWinner());
                }

                securityResponse.setIntent(intentData);
                return securityResponse;

            } catch (Exception e) {
                log.error("Fine-tuned intent classification failed: {}", e.getMessage());
                // Return with original zero-shot intent if fine-tuned fails
                log.warn("Returning response with zero-shot intent due to fine-tuned model failure");
                return securityResponse;
            }

        } catch (AiServiceException e) {
            log.error("Voice processing failed for service {}: {}", e.getServiceName(), e.getMessage());

            // Return a failed response instead of throwing
            ModalSecurityResponse failedResponse = new ModalSecurityResponse();
            failedResponse.setStatus("ERROR");
            failedResponse.setReason("AI service temporarily unavailable: " + e.getMessage());
            failedResponse.setScore(0.0);
            return failedResponse;
        }
    }

    /**
     * Classify using fine-tuned intent agent (primary) with zero-shot fallback
     * Returns either IntentAgentResponse or DeBertaClassificationResponse
     */
    public Object classifyIntentWithFallback(String text) {
        log.info("Attempting classification with fine-tuned intent agent for: {}", text);

        try {
            // Try fine-tuned NER model first with retry logic
            Map<String, String> request = new HashMap<>();
            request.put("text", text);

            log.info("Sending request to fine-tuned model: {}", modalIntentUrl);

            IntentAgentResponse intentResponse = executeWithRetry(
                "FineTunedIntentAgent",
                modalIntentUrl,
                () -> restTemplate.postForObject(
                    modalIntentUrl,
                    request,
                    IntentAgentResponse.class
                )
            );

            if (intentResponse != null && intentResponse.getIntent() != null) {
                log.info("Fine-tuned model result: intent={}, entities={}",
                    intentResponse.getIntent(), intentResponse.getEntities());

                // Return the IntentAgentResponse directly
                return intentResponse;
            } else {
                log.warn("Fine-tuned model returned null response. Falling back to zero-shot");
                return classifyIntent(text, DEFAULT_LABELS);
            }

        } catch (AiServiceException e) {
            log.warn("Fine-tuned model failed: {}. Falling back to zero-shot DeBERTa", e.getMessage());
            // Fallback to zero-shot model - returns DeBertaClassificationResponse
            return classifyIntent(text, DEFAULT_LABELS);
        }
    }

    /**
     * Classify Romanian text using DeBERTa with retry logic
     */
    public DeBertaClassificationResponse classifyIntent(String text) {
        return classifyIntent(text, DEFAULT_LABELS);
    }

    /**
     * Classify Romanian text with custom labels and retry logic
     */
    public DeBertaClassificationResponse classifyIntent(String text, List<String> labels) {
        DeBertaClassificationRequest request = DeBertaClassificationRequest.builder()
            .text(text)
            .labels(labels)
            .build();

        log.info("Sending classification request for text: {}", text);

        return executeWithRetry(
            "DeBertaZeroShot",
            modalDebertaUrl,
            () -> {
                DeBertaClassificationResponse response = restTemplate.postForObject(
                    modalDebertaUrl,
                    request,
                    DeBertaClassificationResponse.class
                );

                if (response == null) {
                    throw new AiServiceException(
                        "DeBertaZeroShot",
                        "Received null response from DeBERTa",
                        false
                    );
                }

                log.info("Classification result: winner={}, score={}",
                    response.getWinner(), response.getScore());
                return response;
            }
        );
    }

    /**
     * Execute an API call with exponential backoff retry logic and circuit breaker pattern
     */
    private <T> T executeWithRetry(
        String serviceName,
        String url,
        RetryableOperation<T> operation
    ) {
        // Check circuit breaker
        if (isCircuitOpen(serviceName)) {
            throw new AiServiceException(
                serviceName,
                "Circuit breaker is OPEN - service is temporarily unavailable",
                false
            );
        }

        long delay = initialRetryDelay;
        Exception lastException = null;

        for (int attempt = 1; attempt <= maxRetryAttempts; attempt++) {
            try {
                log.info("Attempt {}/{} to call {} at {}", attempt, maxRetryAttempts, serviceName, url);

                T result = operation.execute();

                // Success - reset circuit breaker
                recordSuccess(serviceName);
                return result;

            } catch (ResourceAccessException e) {
                // Timeout or connection error - retryable
                lastException = e;
                log.warn("Attempt {}/{} failed for {} - Network error: {}",
                    attempt, maxRetryAttempts, serviceName, e.getMessage());

                if (attempt < maxRetryAttempts) {
                    waitBeforeRetry(delay, serviceName, attempt);
                    delay = Math.min(delay * 2, maxRetryDelay); // Exponential backoff
                }

            } catch (RestClientException e) {
                // HTTP error - may or may not be retryable
                lastException = e;
                String errorMsg = e.getMessage();

                // 4xx errors are not retryable (except 429 Too Many Requests and 408 Request Timeout)
                if (errorMsg != null && (errorMsg.contains("400") || errorMsg.contains("401") ||
                    errorMsg.contains("403") || errorMsg.contains("404"))) {
                    log.error("Non-retryable error for {}: {}", serviceName, errorMsg);
                    recordFailure(serviceName);
                    throw new AiServiceException(serviceName, errorMsg, e, false);
                }

                log.warn("Attempt {}/{} failed for {} - HTTP error: {}",
                    attempt, maxRetryAttempts, serviceName, errorMsg);

                if (attempt < maxRetryAttempts) {
                    waitBeforeRetry(delay, serviceName, attempt);
                    delay = Math.min(delay * 2, maxRetryDelay);
                }

            } catch (Exception e) {
                // Unexpected error
                lastException = e;
                log.error("Unexpected error on attempt {}/{} for {}: {}",
                    attempt, maxRetryAttempts, serviceName, e.getMessage(), e);

                if (attempt < maxRetryAttempts) {
                    waitBeforeRetry(delay, serviceName, attempt);
                    delay = Math.min(delay * 2, maxRetryDelay);
                }
            }
        }

        // All retries exhausted
        recordFailure(serviceName);
        String errorMsg = String.format(
            "All %d retry attempts failed for %s. Last error: %s",
            maxRetryAttempts,
            serviceName,
            lastException != null ? lastException.getMessage() : "Unknown error"
        );
        log.error(errorMsg);
        throw new AiServiceException(serviceName, errorMsg, lastException, true);
    }

    private void waitBeforeRetry(long delayMs, String serviceName, int attemptNumber) {
        try {
            log.info("Waiting {}ms before retry attempt {} for {}", delayMs, attemptNumber + 1, serviceName);
            Thread.sleep(delayMs);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Retry interrupted", ie);
        }
    }

    /**
     * Check if circuit breaker is open for a service
     */
    private boolean isCircuitOpen(String serviceName) {
        ServiceHealthState state = serviceHealth.computeIfAbsent(serviceName, k -> new ServiceHealthState());

        if (state.isCircuitOpen) {
            // Check if enough time has passed to try again
            Duration timeSinceOpen = Duration.between(state.circuitOpenedAt, Instant.now());
            if (timeSinceOpen.compareTo(ServiceHealthState.CIRCUIT_RESET_DURATION) > 0) {
                log.info("Circuit breaker for {} is transitioning to HALF-OPEN state", serviceName);
                state.isCircuitOpen = false;
                state.consecutiveFailures = 0;
                return false;
            }

            log.warn("Circuit breaker for {} is OPEN. Time remaining: {}s",
                serviceName,
                ServiceHealthState.CIRCUIT_RESET_DURATION.minus(timeSinceOpen).getSeconds());
            return true;
        }

        return false;
    }

    /**
     * Record a successful API call
     */
    private void recordSuccess(String serviceName) {
        ServiceHealthState state = serviceHealth.computeIfAbsent(serviceName, k -> new ServiceHealthState());
        state.consecutiveFailures = 0;
        state.lastFailureTime = null;
        if (state.isCircuitOpen) {
            log.info("Circuit breaker for {} is now CLOSED after successful call", serviceName);
            state.isCircuitOpen = false;
            state.circuitOpenedAt = null;
        }
    }

    /**
     * Record a failed API call and potentially open the circuit breaker
     */
    private void recordFailure(String serviceName) {
        ServiceHealthState state = serviceHealth.computeIfAbsent(serviceName, k -> new ServiceHealthState());
        state.consecutiveFailures++;
        state.lastFailureTime = Instant.now();

        if (state.consecutiveFailures >= ServiceHealthState.FAILURE_THRESHOLD && !state.isCircuitOpen) {
            log.error("Circuit breaker for {} is now OPEN after {} consecutive failures",
                serviceName, state.consecutiveFailures);
            state.isCircuitOpen = true;
            state.circuitOpenedAt = Instant.now();
        }
    }

    /**
     * Extract voice fingerprint from audio using WavLM model
     * This creates a 512-dimensional embedding for voice authentication
     *
     * @param audioBase64 Base64 encoded audio file (M4A, WAV, MP3, etc.)
     * @return List of 512 double values representing the voice fingerprint
     */
    public List<Double> extractVoiceFingerprint(String audioBase64) {
        log.info("Extracting voice fingerprint from audio (size: {} bytes)", audioBase64.length());

        if (modalFingerprintUrl == null || modalFingerprintUrl.isEmpty()) {
            throw new AiServiceException(
                "FingerprintExtractor",
                "Fingerprint service URL not configured",
                false
            );
        }

        // Modal @web_endpoint exposes the function at the root URL, not /get_fingerprint
        String endpoint = modalFingerprintUrl;

        return executeWithRetry(
            "FingerprintExtractor",
            endpoint,
            () -> {
                // Decode base64 to bytes
                byte[] audioBytes = Base64.getDecoder().decode(audioBase64);

                // Create multipart request
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);

                // Create file resource from bytes
                ByteArrayResource audioResource = new ByteArrayResource(audioBytes) {
                    @Override
                    public String getFilename() {
                        return "audio.m4a";
                    }
                };

                // Build multipart body
                MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                body.add("audio", audioResource);

                HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

                // Call the Modal endpoint - it returns the fingerprint array directly
                @SuppressWarnings("unchecked")
                List<Double> fingerprint = restTemplate.postForObject(
                    endpoint,
                    requestEntity,
                    List.class
                );

                if (fingerprint == null || fingerprint.isEmpty()) {
                    throw new AiServiceException(
                        "FingerprintExtractor",
                        "Received null or empty fingerprint from extraction service",
                        false
                    );
                }

                if (fingerprint.size() != 512) {
                    log.warn("Unexpected fingerprint dimension: {} (expected 512)", fingerprint.size());
                }

                log.info("Voice fingerprint extracted successfully. Dimension: {}", fingerprint.size());
                return fingerprint;
            }
        );
    }

    /**
     * Get health status of all AI services
     */
    public Map<String, Object> getServicesHealthStatus() {
        Map<String, Object> health = new HashMap<>();

        for (Map.Entry<String, ServiceHealthState> entry : serviceHealth.entrySet()) {
            Map<String, Object> serviceStatus = new HashMap<>();
            ServiceHealthState state = entry.getValue();

            serviceStatus.put("isAvailable", !state.isCircuitOpen);
            serviceStatus.put("consecutiveFailures", state.consecutiveFailures);
            serviceStatus.put("lastFailure", state.lastFailureTime);

            if (state.isCircuitOpen && state.circuitOpenedAt != null) {
                Duration timeSinceOpen = Duration.between(state.circuitOpenedAt, Instant.now());
                long secondsUntilReset = ServiceHealthState.CIRCUIT_RESET_DURATION.minus(timeSinceOpen).getSeconds();
                serviceStatus.put("circuitResetInSeconds", Math.max(0, secondsUntilReset));
            }

            health.put(entry.getKey(), serviceStatus);
        }

        return health;
    }


    @FunctionalInterface
    private interface RetryableOperation<T> {
        T execute() throws Exception;
    }
}

