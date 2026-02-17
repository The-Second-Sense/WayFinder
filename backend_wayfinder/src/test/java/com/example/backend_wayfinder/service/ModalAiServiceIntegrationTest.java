package com.example.backend_wayfinder.service;

import com.example.backend_wayfinder.Dto.DeBertaClassificationResponse;
import com.example.backend_wayfinder.Dto.IntentAgentResponse;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test for ModalAiService
 * These tests call real Modal endpoints - disabled by default
 */
@SpringBootTest
class ModalAiServiceIntegrationTest {

    @Autowired
    private ModalAiService modalAiService;

    @Test
    @Disabled("Requires Modal services to be running - enable for manual testing")
    void testClassifyIntentWithFallback_RealAPI() {
        // Given
        String text = "Transferă 100 RON către Andrei";

        // When
        Object response = modalAiService.classifyIntentWithFallback(text);

        // Then
        assertThat(response).isNotNull();

        // Can be either fine-tuned or zero-shot response
        if (response instanceof IntentAgentResponse) {
            IntentAgentResponse intentResponse = (IntentAgentResponse) response;
            assertThat(intentResponse.getIntent()).isIn("TRANSFER", "ALTELE");
        } else if (response instanceof DeBertaClassificationResponse) {
            DeBertaClassificationResponse debertaResponse = (DeBertaClassificationResponse) response;
            assertThat(debertaResponse.getWinner()).isIn("TRANSFER", "ALTELE");
            assertThat(debertaResponse.getScore()).isGreaterThan(0.0);
        }
    }

    @Test
    @Disabled("Requires Modal services to be running - enable for manual testing")
    void testClassifyIntent_CheckBalance() {
        // Given
        String text = "Cât este soldul meu?";

        // When
        Object response = modalAiService.classifyIntentWithFallback(text);

        // Then
        assertThat(response).isNotNull();

        // Can be either fine-tuned or zero-shot response
        if (response instanceof IntentAgentResponse) {
            IntentAgentResponse intentResponse = (IntentAgentResponse) response;
            assertThat(intentResponse.getIntent()).isNotNull();
        } else if (response instanceof DeBertaClassificationResponse) {
            DeBertaClassificationResponse debertaResponse = (DeBertaClassificationResponse) response;
            assertThat(debertaResponse.getWinner()).isNotNull();
        }
    }
}

