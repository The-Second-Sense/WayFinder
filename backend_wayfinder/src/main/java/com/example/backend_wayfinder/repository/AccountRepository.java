package com.example.backend_wayfinder.repository;

import com.example.backend_wayfinder.entities.AccountEntity;
import jakarta.persistence.LockModeType;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface AccountRepository extends JpaRepository<AccountEntity, Integer> {

    Optional<AccountEntity> findByAccountNumber(String accountNumber);

    List<AccountEntity> findByUser_UserId(UUID userId);

    List<AccountEntity> findByUser_UserIdAndIsActive(UUID userId, Boolean isActive);

    @Query("SELECT a FROM AccountEntity a WHERE a.user.userId = :userId AND a.currency = :currency AND a.isActive = true")
    List<AccountEntity> findActiveAccountsByUserAndCurrency(@Param("userId") UUID userId,
                                                      @Param("currency") String currency);

    boolean existsByAccountNumber(String accountNumber);

    @Query("SELECT SUM(a.balance) FROM AccountEntity a WHERE a.user.userId = :userId AND a.isActive = true")
    Optional<java.math.BigDecimal> getTotalBalanceByUserId(@Param("userId") UUID userId);

    /**
     * Locks the account row FOR UPDATE — blocks any other transaction
     * from reading or writing this row until the current transaction commits.
     * Used during money transfers to prevent race conditions.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM AccountEntity a WHERE a.accountId = :accountId")
    Optional<AccountEntity> findByIdWithLock(@Param("accountId") Integer accountId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM AccountEntity a WHERE a.accountNumber = :accountNumber")
    Optional<AccountEntity> findByAccountNumberWithLock(@Param("accountNumber") String accountNumber);

    @Query("SELECT a FROM AccountEntity a WHERE a.user.phoneNumber = :phoneNumber AND a.isActive = true ORDER BY a.createdAt ASC")
    List<AccountEntity> findActiveAccountsByUserPhoneNumber(@Param("phoneNumber") String phoneNumber);
}


