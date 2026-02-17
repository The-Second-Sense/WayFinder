package com.example.backend_wayfinder.repository;


import com.example.backend_wayfinder.entities.AiInteractionLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AiInteractionLogRepository extends JpaRepository<AiInteractionLogEntity, Integer> {

    List<AiInteractionLogEntity> findByUser_UserId(UUID userId);

    Page<AiInteractionLogEntity> findByUser_UserId(UUID userId, Pageable pageable);

    List<AiInteractionLogEntity> findByUser_UserIdAndIntentDetected(UUID userId, String intentDetected);

    @Query("SELECT a FROM AiInteractionLogEntity a WHERE a.user.userId = :userId " +
            "AND a.createdAt BETWEEN :startDate AND :endDate")
    List<AiInteractionLogEntity> findByUserAndDateRange(@Param("userId") UUID userId,
                                                  @Param("startDate") LocalDateTime startDate,
                                                  @Param("endDate") LocalDateTime endDate);

    @Query("SELECT a FROM AiInteractionLogEntity a WHERE a.user.userId = :userId " +
            "AND a.confidenceScore >= :minConfidence ORDER BY a.createdAt DESC")
    List<AiInteractionLogEntity> findHighConfidenceInteractions(@Param("userId") UUID userId,
                                                          @Param("minConfidence") BigDecimal minConfidence,
                                                          Pageable pageable);

    Optional<AiInteractionLogEntity> findByLinkedTransactionId(Integer transactionId);

    @Query("SELECT a.intentDetected, COUNT(a) FROM AiInteractionLogEntity a " +
            "WHERE a.user.userId = :userId GROUP BY a.intentDetected")
    List<Object[]> getIntentDistribution(@Param("userId") UUID userId);

    @Query("SELECT AVG(l.confidenceScore) FROM AiInteractionLogEntity l WHERE l.user.userId = :userId")
    Optional<BigDecimal> getAverageConfidenceScore(@Param("userId") UUID userId);

    @Query("SELECT COUNT(l) FROM AiInteractionLogEntity l WHERE l.user.userId = :userId AND l.createdAt >= :since")
    long countRecentInteractions(@Param("userId") UUID userId,
                                 @Param("since") LocalDateTime since);
}

