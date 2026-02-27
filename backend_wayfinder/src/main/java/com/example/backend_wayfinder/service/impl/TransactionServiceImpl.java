package com.example.backend_wayfinder.service.impl;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.CreateTransactionRequest;
import com.example.backend_wayfinder.Dto.TransactionDto;
import com.example.backend_wayfinder.entities.AccountEntity;
import com.example.backend_wayfinder.entities.TransactionEntity;
import com.example.backend_wayfinder.entities.UserEntity;
import com.example.backend_wayfinder.exception.AccountInactiveException;
import com.example.backend_wayfinder.exception.InsufficientBalanceException;
import com.example.backend_wayfinder.exception.ResourceNotFoundException;
import com.example.backend_wayfinder.exception.VoiceAuthenticationException;
import com.example.backend_wayfinder.repository.AccountRepository;
import com.example.backend_wayfinder.repository.TransactionRepository;
import com.example.backend_wayfinder.service.TransactionService;
import com.example.backend_wayfinder.service.VoiceAuthenticationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(isolation = Isolation.SERIALIZABLE)
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final VoiceAuthenticationService voiceAuthenticationService;

    @Override
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public TransactionDto createTransaction(CreateTransactionRequest request) {
        log.info("Creating transaction from account ID: {} to account: {}",
                request.getSourceAccountId(), request.getDestinationAccountNumber());

        if (request.getCurrency() == null || request.getCurrency().isEmpty()) {
            request.setCurrency("RON");
        }
        if (request.getInitiatedBy() == null || request.getInitiatedBy().isEmpty()) {
            request.setInitiatedBy("USER");
        }

        // Lock the source account row — any concurrent transfer on this account will wait here
        AccountEntity sourceAccount = accountRepository.findByIdWithLock(request.getSourceAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Source account not found: " + request.getSourceAccountId()));

        UserEntity user = sourceAccount.getUser();

        if (!sourceAccount.getIsActive()) {
            throw new AccountInactiveException("Source account is not active");
        }

        if (user.getIsVoiceAuthEnabled() && request.getCurrentVoiceFingerprint() != null) {
            boolean isVoiceValid = voiceAuthenticationService.verifyVoice(
                    request.getCurrentVoiceFingerprint(),
                    user.getVoiceFingerprint()
            );
            if (!isVoiceValid) {
                log.error("Voice authentication failed for user ID: {}", user.getUserId());
                throw new VoiceAuthenticationException("Voice authentication failed");
            }
            log.info("Voice authentication successful for user ID: {}", user.getUserId());
        }

        if (sourceAccount.getBalance().compareTo(request.getAmount()) < 0) {
            throw new InsufficientBalanceException(
                    String.format("Insufficient balance. Available: %.2f %s, Requested: %.2f %s",
                            sourceAccount.getBalance(), sourceAccount.getCurrency(),
                            request.getAmount(), request.getCurrency()));
        }

        TransactionEntity transaction = TransactionEntity.builder()
                .sourceAccount(sourceAccount)
                .destinationAccountNumber(request.getDestinationAccountNumber())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .description(request.getDescription())
                .status("PENDING")
                .initiatedBy(request.getInitiatedBy())
                .build();

        TransactionEntity savedTransaction = transactionRepository.save(transaction);

        // Debit sender (balance was just read with a lock so it's always fresh)
        sourceAccount.setBalance(sourceAccount.getBalance().subtract(request.getAmount()));
        accountRepository.save(sourceAccount);
        log.info("Debited {} {} from account ID: {}", request.getAmount(), request.getCurrency(), sourceAccount.getAccountId());

        // Credit receiver if account exists in this bank — also locked to avoid double-credit
        accountRepository.findByAccountNumberWithLock(request.getDestinationAccountNumber())
                .ifPresent(destinationAccount -> {
                    destinationAccount.setBalance(destinationAccount.getBalance().add(request.getAmount()));
                    accountRepository.save(destinationAccount);
                    log.info("Credited {} {} to account ID: {}", request.getAmount(), request.getCurrency(), destinationAccount.getAccountId());
                });

        savedTransaction.setStatus("COMPLETED");
        transactionRepository.save(savedTransaction);

        log.info("Transaction completed successfully with ID: {}", savedTransaction.getId());

        return convertToDto(savedTransaction);
    }

    @Override
    public TransactionDto getTransactionById(Integer transactionId) {
        TransactionEntity transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + transactionId));
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
        List<AccountEntity> accounts = accountRepository.findByUser_UserId(userId);

        List<String> accountNumbers = accounts.stream()
                .map(AccountEntity::getAccountNumber)
                .collect(Collectors.toList());

        List<Integer> accountIds = accounts.stream()
                .map(AccountEntity::getAccountId)
                .collect(Collectors.toList());

        // Sent transactions
        List<TransactionEntity> sent = accounts.stream()
                .flatMap(account -> transactionRepository.findBySourceAccount_AccountId(account.getAccountId()).stream())
                .collect(Collectors.toList());

        // Received transactions (destination is one of the user's account numbers)
        List<TransactionEntity> received = accountNumbers.stream()
                .flatMap(accountNumber -> transactionRepository.findByDestinationAccountNumber(accountNumber).stream())
                // exclude self-transfers already in sent list
                .filter(t -> !accountIds.contains(t.getSourceAccount().getAccountId()))
                .collect(Collectors.toList());

        // Tag direction and merge, newest first
        List<TransactionDto> sentDtos = sent.stream()
                .map(t -> convertToDto(t, "SENT"))
                .collect(Collectors.toList());

        List<TransactionDto> receivedDtos = received.stream()
                .map(t -> convertToDto(t, "RECEIVED"))
                .collect(Collectors.toList());

        return java.util.stream.Stream.concat(sentDtos.stream(), receivedDtos.stream())
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
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
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + transactionId));

        transaction.setStatus(status);
        transactionRepository.save(transaction);

        log.info("Transaction status updated successfully");
    }

    @Override
    public String getTransactionStatus(Integer transactionId) {
        TransactionEntity transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + transactionId));
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
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + accountId));

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

    // Helper methods
    private TransactionDto convertToDto(TransactionEntity transaction) {
        return convertToDto(transaction, null);
    }

    private TransactionDto convertToDto(TransactionEntity transaction, String direction) {
        return TransactionDto.builder()
                .id(transaction.getId())
                .sourceAccountId(transaction.getSourceAccount().getAccountId())
                .destinationAccountNumber(transaction.getDestinationAccountNumber())
                .amount(transaction.getAmount())
                .currency(transaction.getCurrency())
                .description(transaction.getDescription())
                .status(transaction.getStatus())
                .createdAt(transaction.getCreatedAt())
                .direction(direction)
                .build();
    }
}

