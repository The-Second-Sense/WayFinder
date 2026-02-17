package com.example.backend_wayfinder.service;

import com.example.backend_wayfinder.Dto.DeBertaClassificationResponse;
import com.example.backend_wayfinder.Dto.IntentAgentResponse;
import com.example.backend_wayfinder.Dto.ModalSecurityResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ModalAiServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private ModalAiService modalAiService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(modalAiService, "modalSecurityUrl", "https://test-security.modal.run");
        ReflectionTestUtils.setField(modalAiService, "modalIntentUrl", "https://test-intent.modal.run");
        ReflectionTestUtils.setField(modalAiService, "modalDebertaUrl", "https://test-deberta.modal.run");
    }

    @Test
    void testClassifyIntent_WithFineTunedModel_Success() {
        // Given
        String text = "Transferă 100 RON către Andrei";

        Map<String, Object> entities = new HashMap<>();
        entities.put("SUMA", Arrays.asList("100"));
        entities.put("VALUTA", Arrays.asList("RON"));
        entities.put("BENEFICIAR", Arrays.asList("Andrei"));

        IntentAgentResponse mockIntentResponse = new IntentAgentResponse();
        mockIntentResponse.setIntent("TRANSFER");
        mockIntentResponse.setEntities(entities);

        when(restTemplate.postForObject(
                eq("https://test-intent.modal.run"),
                any(Map.class),
                eq(IntentAgentResponse.class)
        )).thenReturn(mockIntentResponse);

        // When
        Object result = modalAiService.classifyIntentWithFallback(text);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).isInstanceOf(IntentAgentResponse.class);
        IntentAgentResponse intentResponse = (IntentAgentResponse) result;
        assertThat(intentResponse.getIntent()).isEqualTo("TRANSFER");
        assertThat(intentResponse.getEntities()).isEqualTo(entities);
        verify(restTemplate, times(1)).postForObject(anyString(), any(), eq(IntentAgentResponse.class));
    }

    @Test
    void testClassifyIntent_FineTunedFails_FallbackToZeroShot() {
        // Given
        String text = "Cât este soldul meu?";

        // Mock fine-tuned model failure
        when(restTemplate.postForObject(
                eq("https://test-intent.modal.run"),
                any(Map.class),
                eq(IntentAgentResponse.class)
        )).thenThrow(new RuntimeException("Fine-tuned model error"));

        // Mock zero-shot fallback success
        DeBertaClassificationResponse fallbackResponse = new DeBertaClassificationResponse();
        fallbackResponse.setWinner("SOLD");
        fallbackResponse.setScore(0.82);
        fallbackResponse.setAll_scores(Map.of("SOLD", 0.82));

        when(restTemplate.postForObject(
                eq("https://test-deberta.modal.run"),
                any(),
                eq(DeBertaClassificationResponse.class)
        )).thenReturn(fallbackResponse);

        // When
        Object result = modalAiService.classifyIntentWithFallback(text);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).isInstanceOf(DeBertaClassificationResponse.class);
        DeBertaClassificationResponse debertaResponse = (DeBertaClassificationResponse) result;
        assertThat(debertaResponse.getWinner()).isEqualTo("SOLD");
        assertThat(debertaResponse.getScore()).isEqualTo(0.82);

        // Verify fallback was called
        verify(restTemplate, times(1)).postForObject(
                eq("https://test-intent.modal.run"), any(), eq(IntentAgentResponse.class));
        verify(restTemplate, times(1)).postForObject(
                eq("https://test-deberta.modal.run"), any(), eq(DeBertaClassificationResponse.class));
    }

    @Test
    void testVerifyVoiceAndTranscribe_Success() {
        // Given
        String audioBase64 = "base64EncodedAudio";
        List<Double> fingerprint = Arrays.asList(0.1, 0.2, 0.3);

        ModalSecurityResponse mockResponse = new ModalSecurityResponse();
        mockResponse.setStatus("GRANTED");
        mockResponse.setScore(0.89);
        mockResponse.setTranscription("Transferă 100 RON către Maria");

        when(restTemplate.postForObject(
                eq("https://test-security.modal.run"),
                any(),
                eq(ModalSecurityResponse.class)
        )).thenReturn(mockResponse);

        // When
        ModalSecurityResponse result = modalAiService.verifyVoiceAndTranscribe(audioBase64, fingerprint);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("GRANTED");
        assertThat(result.getScore()).isEqualTo(0.89);
        assertThat(result.getTranscription()).isEqualTo("Transferă 100 RON către Maria");
    }

    @Test
    void testVerifyVoiceAndTranscribe_VoiceDenied() {
        // Given
        String audioBase64 = "base64EncodedAudio";
        List<Double> fingerprint = Arrays.asList(0.1, 0.2, 0.3);

        ModalSecurityResponse mockResponse = new ModalSecurityResponse();
        mockResponse.setStatus("DENIED");
        mockResponse.setScore(0.45);
        mockResponse.setReason("Voice mismatch");

        when(restTemplate.postForObject(
                eq("https://test-security.modal.run"),
                any(),
                eq(ModalSecurityResponse.class)
        )).thenReturn(mockResponse);

        // When
        ModalSecurityResponse result = modalAiService.verifyVoiceAndTranscribe(audioBase64, fingerprint);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("DENIED");
        assertThat(result.getReason()).isEqualTo("Voice mismatch");
    }

    @Test
    void testProcessVoiceWithFineTunedIntent_CompleteFlow() {
        // Given
        String audioBase64 = "base64EncodedAudio";
        List<Double> fingerprint = Arrays.asList(0.1, 0.2, 0.3);

        // Mock security response
        ModalSecurityResponse securityResponse = new ModalSecurityResponse();
        securityResponse.setStatus("GRANTED");
        securityResponse.setScore(0.89);
        securityResponse.setTranscription("Transferă 50 euro către Pulea");

        when(restTemplate.postForObject(
                eq("https://test-security.modal.run"),
                any(),
                eq(ModalSecurityResponse.class)
        )).thenReturn(securityResponse);

        // Mock fine-tuned intent response
        IntentAgentResponse intentResponse = new IntentAgentResponse();
        intentResponse.setIntent("TRANSFER");
        intentResponse.setEntities(Map.of("SUMA", Arrays.asList("50")));

        when(restTemplate.postForObject(
                eq("https://test-intent.modal.run"),
                any(Map.class),
                eq(IntentAgentResponse.class)
        )).thenReturn(intentResponse);

        // When
        ModalSecurityResponse result = modalAiService.processVoiceWithFineTunedIntent(audioBase64, fingerprint);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo("GRANTED");
        assertThat(result.getTranscription()).isEqualTo("Transferă 50 euro către Pulea");
        assertThat(result.getIntent()).isNotNull();
        assertThat(result.getIntent().get("winner")).isEqualTo("TRANSFER");
    }
}

