package com.example.backend_wayfinder.service.impl;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.AiInteractionLogDto;
import com.example.backend_wayfinder.entities.AiInteractionLogEntity;
import com.example.backend_wayfinder.entities.TransactionEntity;
import com.example.backend_wayfinder.entities.UserEntity;
import com.example.backend_wayfinder.enums.AiMode;
import com.example.backend_wayfinder.repository.AiInteractionLogRepository;
import com.example.backend_wayfinder.repository.TransactionRepository;
import com.example.backend_wayfinder.repository.UserRepository;
import com.example.backend_wayfinder.service.AiInteractionLogService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AiInteractionLogServiceImpl implements AiInteractionLogService {

    private final AiInteractionLogRepository aiInteractionLogRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    @Override
    public AiInteractionLogDto createLog(AiInteractionLogDto logDto) {
        log.info("Creating AI interaction log for user ID: {}", logDto.getUserId());

        UserEntity user = userRepository.findById(logDto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        AiInteractionLogEntity logEntity = AiInteractionLogEntity.builder()
                .user(user)
                .voiceCommandTranscript(logDto.getVoiceCommandTranscript())
                .aiMode(logDto.getAiMode())
                .intentDetected(logDto.getIntentDetected())
                .confidenceScore(logDto.getConfidenceScore())
                .actionTaken(logDto.getActionTaken())
                .aiResponse(logDto.getAiResponse())
                .build();

        // Link transaction if provided
        if (logDto.getLinkedTransactionId() != null) {
            TransactionEntity transaction = transactionRepository.findById(logDto.getLinkedTransactionId())
                    .orElse(null);
            logEntity.setLinkedTransaction(transaction);
        }

        AiInteractionLogEntity savedLog = aiInteractionLogRepository.save(logEntity);
        log.info("AI interaction log created with ID: {}", savedLog.getLogId());

        return convertToDto(savedLog);
    }

    @Override
    public AiInteractionLogDto getLogById(Integer logId) {
        AiInteractionLogEntity logEntity = aiInteractionLogRepository.findById(logId)
                .orElseThrow(() -> new RuntimeException("AI interaction log not found"));
        return convertToDto(logEntity);
    }

    @Override
    public List<AiInteractionLogDto> getLogsByUserId(UUID userId) {
        List<AiInteractionLogEntity> logs = aiInteractionLogRepository.findByUser_UserId(userId);
        return logs.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<AiInteractionLogDto> getLogsByDateRange(UUID userId, LocalDateTime startDate, LocalDateTime endDate) {
        List<AiInteractionLogEntity> logs = aiInteractionLogRepository.findByUserAndDateRange(userId, startDate, endDate);
        return logs.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<AiInteractionLogDto> getLogsByIntent(UUID userId, String intent) {
        List<AiInteractionLogEntity> logs = aiInteractionLogRepository.findByUser_UserIdAndIntentDetected(userId, intent);
        return logs.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // Helper method
    private AiInteractionLogDto convertToDto(AiInteractionLogEntity entity) {
        return AiInteractionLogDto.builder()
                .logId(entity.getLogId())
                .userId(entity.getUser().getUserId())
                .voiceCommandTranscript(entity.getVoiceCommandTranscript())
                .aiMode(entity.getAiMode())
                .intentDetected(entity.getIntentDetected())
                .confidenceScore(entity.getConfidenceScore())
                .actionTaken(entity.getActionTaken())
                .aiResponse(entity.getAiResponse())
                .linkedTransactionId(entity.getLinkedTransaction() != null ?
                        entity.getLinkedTransaction().getId() : null)
                .createdAt(entity.getCreatedAt())
                .build();
    }
}


