package com.example.backend_wayfinder.entities;


import com.example.backend_wayfinder.enums.AiMode;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Entity
@Table(name = "ai_interaction_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiInteractionLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Integer logId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "voice_command_transcript", columnDefinition = "TEXT")
    private String voiceCommandTranscript;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_mode", nullable = false)
    private AiMode aiMode;  // GUIDE or AGENT

    @Column(name = "intent_detected")
    private String intentDetected;

    @Column(name = "confidence_score", precision = 5, scale = 2)
    private BigDecimal confidenceScore;

    @Column(name = "action_taken")
    private String actionTaken;

    @Column(name = "ai_response", columnDefinition = "TEXT")
    private String aiResponse;  // The AI's guidance or confirmation message

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_transaction_id")
    private TransactionEntity linkedTransaction;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
