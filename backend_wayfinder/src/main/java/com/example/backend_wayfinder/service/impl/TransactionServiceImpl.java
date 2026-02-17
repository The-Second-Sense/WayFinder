package com.example.backend_wayfinder.service.impl;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.CreateTransactionRequest;
import com.example.backend_wayfinder.Dto.TransactionDto;
import com.example.backend_wayfinder.entities.AccountEntity;
import com.example.backend_wayfinder.entities.TransactionEntity;
import com.example.backend_wayfinder.entities.UserEntity;
import com.example.backend_wayfinder.repository.AccountRepository;
import com.example.backend_wayfinder.repository.TransactionRepository;
import com.example.backend_wayfinder.service.TransactionService;
import com.example.backend_wayfinder.service.VoiceAuthenticationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final VoiceAuthenticationService voiceAuthenticationService;

    @Override
    public TransactionDto createTransaction(CreateTransactionRequest request) {
        log.info("Creating transaction from account ID: {} to account: {}",
                request.getSourceAccountId(), request.getDestinationAccountNumber());

        // Set default currency if not provided
        if (request.getCurrency() == null || request.getCurrency().isEmpty()) {
            request.setCurrency("RON");
        }

        // Get source account
        AccountEntity sourceAccount = accountRepository.findById(request.getSourceAccountId())
                .orElseThrow(() -> new RuntimeException("Source account not found"));

        UserEntity user = sourceAccount.getUser();

        // Validate account is active
        if (!sourceAccount.getIsActive()) {
            throw new RuntimeException("Source account is not active");
        }

        // Voice authentication if enabled and fingerprint provided
        if (user.getIsVoiceAuthEnabled() && request.getCurrentVoiceFingerprint() != null) {
            boolean isVoiceValid = voiceAuthenticationService.verifyVoice(
                    request.getCurrentVoiceFingerprint(),
                    user.getVoiceFingerprint()
            );
            if (!isVoiceValid) {
                log.error("Voice authentication failed for user ID: {}", user.getUserId());
                throw new RuntimeException("Voice authentication failed");
            }
            log.info("Voice authentication successful for user ID: {}", user.getUserId());
        }

        // Validate sufficient balance
        if (sourceAccount.getBalance().compareTo(request.getAmount()) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        // Create transaction
        TransactionEntity transaction = TransactionEntity.builder()
                .sourceAccount(sourceAccount)
                .destinationAccountNumber(request.getDestinationAccountNumber())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .description(request.getDescription())
                .status("PENDING")
                .initiatedBy(request.getInitiatedBy())
                .build();

        // Save transaction
        TransactionEntity savedTransaction = transactionRepository.save(transaction);

        // Update account balance
        BigDecimal newBalance = sourceAccount.getBalance().subtract(request.getAmount());
        sourceAccount.setBalance(newBalance);
        accountRepository.save(sourceAccount);

        // Update transaction status to completed
        savedTransaction.setStatus("COMPLETED");
        transactionRepository.save(savedTransaction);

        log.info("Transaction created successfully with ID: {}", savedTransaction.getId());

        return convertToDto(savedTransaction);
    }

    @Override
    public TransactionDto getTransactionById(Integer transactionId) {
        TransactionEntity transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        return convertToDto(transaction);
    }

    @Override
    public List<TransactionDto> getTransactionsByAccountId(Integer accountId) {
        List<TransactionEntity> transactions = transactionRepository.findBySourceAccount_AccountId(accountId);
        return transactions.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionDto> getTransactionsByUserId(UUID userId) {
        // Get all accounts for user, then get all transactions
        List<AccountEntity> accounts = accountRepository.findByUser_UserId(userId);
        return accounts.stream()
                .flatMap(account -> transactionRepository.findBySourceAccount_AccountId(account.getAccountId()).stream())
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionDto> getTransactionsByDateRange(Integer accountId, LocalDateTime startDate, LocalDateTime endDate) {
        List<TransactionEntity> transactions = transactionRepository.findByAccountAndDateRange(accountId, startDate, endDate);
        return transactions.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public void updateTransactionStatus(Integer transactionId, String status) {
        log.info("Updating transaction ID: {} to status: {}", transactionId, status);

        TransactionEntity transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        transaction.setStatus(status);
        transactionRepository.save(transaction);

        log.info("Transaction status updated successfully");
    }

    @Override
    public String getTransactionStatus(Integer transactionId) {
        TransactionEntity transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        return transaction.getStatus();
    }

    @Override
    public BigDecimal getTotalSent(Integer accountId, LocalDateTime startDate, LocalDateTime endDate) {
        return transactionRepository.getTotalAmountByAccountAndDateRange(accountId, startDate, endDate)
                .orElse(BigDecimal.ZERO);
    }

    @Override
    public BigDecimal getTotalReceived(Integer accountId, LocalDateTime startDate, LocalDateTime endDate) {
        // Get account details
        AccountEntity account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        // Find transactions where this account is the destination
        List<TransactionEntity> receivedTransactions = transactionRepository
                .findByDestinationAccountNumber(account.getAccountNumber());

        return receivedTransactions.stream()
                .filter(t -> t.getCreatedAt().isAfter(startDate) && t.getCreatedAt().isBefore(endDate))
                .filter(t -> "COMPLETED".equals(t.getStatus()))
                .map(TransactionEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public boolean transactionExists(Integer transactionId) {
        return transactionRepository.existsById(transactionId);
    }

    // Helper method
    private TransactionDto convertToDto(TransactionEntity transaction) {
        return TransactionDto.builder()
                .id(transaction.getId())
                .sourceAccountId(transaction.getSourceAccount().getAccountId())
                .destinationAccountNumber(transaction.getDestinationAccountNumber())
                .amount(transaction.getAmount())
                .currency(transaction.getCurrency())
                .description(transaction.getDescription())
                .status(transaction.getStatus())
                .initiatedBy(transaction.getInitiatedBy())
                .createdAt(transaction.getCreatedAt())
                .build();
    }
}

