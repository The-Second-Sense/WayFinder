package com.example.backend_wayfinder.repository;

import java.util.UUID;

import com.example.backend_wayfinder.entities.TransactionEntity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;


@Repository
public interface TransactionRepository extends JpaRepository<TransactionEntity,Integer> {

    List<TransactionEntity> findBySourceAccount_AccountId(Integer accountId);

    Page<TransactionEntity> findBySourceAccount_AccountId(Integer accountId, Pageable pageable);

    List<TransactionEntity> findBySourceAccount_AccountIdAndStatus(Integer accountId, String status);

    @Query("SELECT t FROM TransactionEntity t WHERE t.sourceAccount.accountId = :accountId " +
            "AND t.createdAt BETWEEN :startDate AND :endDate")
    List<TransactionEntity> findByAccountAndDateRange(@Param("accountId") Integer accountId,
                                                @Param("startDate") LocalDateTime startDate,
                                                @Param("endDate") LocalDateTime endDate);

    @Query("SELECT t FROM TransactionEntity t WHERE t.sourceAccount.user.userId = :userId " +
            "ORDER BY t.createdAt DESC")
    Page<TransactionEntity> findByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT t FROM TransactionEntity t WHERE t.sourceAccount.accountId = :accountId " +
            "AND t.status = :status ORDER BY t.createdAt DESC")
    List<TransactionEntity> findRecentByAccountAndStatus(@Param("accountId") Integer accountId,
                                                   @Param("status") String status,
                                                   Pageable pageable);

    @Query("SELECT SUM(t.amount) FROM TransactionEntity t WHERE t.sourceAccount.accountId = :accountId " +
            "AND t.status = 'COMPLETED' AND t.createdAt BETWEEN :startDate AND :endDate")
    Optional<BigDecimal> getTotalAmountByAccountAndDateRange(@Param("accountId") Integer accountId,
                                                             @Param("startDate") LocalDateTime startDate,
                                                             @Param("endDate") LocalDateTime endDate);

    List<TransactionEntity> findByDestinationAccountNumber(String destinationAccountNumber);

    @Query("SELECT COUNT(t) FROM TransactionEntity t WHERE t.sourceAccount.user.userId = :userId " +
            "AND t.status = :status")
    long countByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") String status);
}
