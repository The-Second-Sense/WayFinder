package com.example.backend_wayfinder.service;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.AiInteractionLogDto;

import java.time.LocalDateTime;
import java.util.List;

public interface AiInteractionLogService {

    /**
     * Create a new AI interaction log
     */
    AiInteractionLogDto createLog(AiInteractionLogDto logDto);

    /**
     * Get interaction by ID
     */
    AiInteractionLogDto getLogById(Integer logId);

    /**
     * Get all interactions for a user
     */
    List<AiInteractionLogDto> getLogsByUserId(UUID userId);

    /**
     * Get interactions by date range
     */
    List<AiInteractionLogDto> getLogsByDateRange(UUID userId, LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Get interactions by intent
     */
    List<AiInteractionLogDto> getLogsByIntent(UUID userId, String intent);
}

