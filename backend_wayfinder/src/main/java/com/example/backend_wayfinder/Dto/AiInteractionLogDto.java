package com.example.backend_wayfinder.Dto;


import java.util.UUID;
import com.example.backend_wayfinder.enums.AiMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiInteractionLogDto {
    private Integer logId;
    private UUID userId;
    private String voiceCommandTranscript;
    private AiMode aiMode;
    private String intentDetected;
    private BigDecimal confidenceScore;
    private String actionTaken;
    private String aiResponse;
    private Integer linkedTransactionId;
    private LocalDateTime createdAt;
}

