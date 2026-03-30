package com.example.backend_wayfinder.service;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.AiInteractionLogDto;
import com.example.backend_wayfinder.Dto.ContactLiteDto;
import com.example.backend_wayfinder.Dto.VoiceCommandRequest;
import com.example.backend_wayfinder.Dto.VoiceCommandResponse;
import com.example.backend_wayfinder.enums.Intent;

import java.time.LocalDateTime;
import java.util.List;

public interface AiAgentService {

    /**
     * Process a voice command - main entry point for AI interactions
     * Handles both GUIDE and AGENT modes
     */
    VoiceCommandResponse processVoiceCommand(VoiceCommandRequest request);

    /**
     * Detect intent from voice transcript using DeBERTa model
     */
    Intent detectIntent(String voiceTranscript);

    /**
     * Get guidance message for a specific intent (GUIDE mode)
     */
    String getGuidanceForIntent(Intent intent);

    /**
     * Execute action based on intent (AGENT mode)
     */
    VoiceCommandResponse executeAction(UUID userId, Intent intent, String voiceTranscript, List<Double> voiceFingerprint, List<ContactLiteDto> contacts);

    /**
     * Get AI interaction history for a user
     */
    List<AiInteractionLogDto> getUserInteractionHistory(UUID userId);

    /**
     * Get recent interactions
     */
    List<AiInteractionLogDto> getRecentInteractions(UUID userId, LocalDateTime since);
}

