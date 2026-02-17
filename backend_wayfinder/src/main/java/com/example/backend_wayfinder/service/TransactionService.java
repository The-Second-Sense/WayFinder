package com.example.backend_wayfinder.service;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.CreateTransactionRequest;
import com.example.backend_wayfinder.Dto.TransactionDto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface TransactionService {


    TransactionDto createTransaction(CreateTransactionRequest request);


    TransactionDto getTransactionById(Integer transactionId);
    List<TransactionDto> getTransactionsByAccountId(Integer accountId);
    List<TransactionDto> getTransactionsByUserId(UUID userId);
    List<TransactionDto> getTransactionsByDateRange(Integer accountId, LocalDateTime startDate, LocalDateTime endDate);

    void updateTransactionStatus(Integer transactionId, String status);
    String getTransactionStatus(Integer transactionId);


    BigDecimal getTotalSent(Integer accountId, LocalDateTime startDate, LocalDateTime endDate);
    BigDecimal getTotalReceived(Integer accountId, LocalDateTime startDate, LocalDateTime endDate);

    boolean transactionExists(Integer transactionId);
}

