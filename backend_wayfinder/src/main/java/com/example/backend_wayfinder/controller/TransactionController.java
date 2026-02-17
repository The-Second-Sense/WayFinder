package com.example.backend_wayfinder.controller;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.CreateTransactionRequest;
import com.example.backend_wayfinder.Dto.TransactionDto;
import com.example.backend_wayfinder.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/trans")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class TransactionController {

    private final TransactionService transactionService;

    /**
     * Process a "Send Page" transaction
     * POST /api/trans/send
     */
    @PostMapping("/send")
    public ResponseEntity<TransactionDto> sendMoney(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody SendMoneyRequest request) {

        log.info("Processing send transaction: {} RON to account {}",
                request.getAmount(), request.getRecipientId());

        try {
            CreateTransactionRequest txRequest = CreateTransactionRequest.builder()
                    .sourceAccountId(request.getSourceAccountId())
                    .destinationAccountNumber(request.getRecipientAccountNumber())
                    .amount(request.getAmount())
                    .currency(request.getCurrency() != null ? request.getCurrency() : "RON")
                    .description(request.getDescription())
                    .initiatedBy("USER")
                    .currentVoiceFingerprint(request.getVoiceFingerprint())
                    .build();

            TransactionDto transaction = transactionService.createTransaction(txRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(transaction);
        } catch (Exception e) {
            log.error("Send transaction failed: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * Process a "Request Page" transaction
     * POST /api/trans/request
     */
    @PostMapping("/request")
    public ResponseEntity<RequestMoneyResponse> requestMoney(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody RequestMoneyRequest request) {

        log.info("Processing money request: {} RON from {}",
                request.getAmount(), request.getTargetId());

        try {
            // TODO: Implement request money logic
            // This typically creates a payment request notification

            RequestMoneyResponse response = RequestMoneyResponse.builder()
                    .requestId(new java.util.Random().nextInt(Integer.MAX_VALUE))
                    .status("PENDING")
                    .message("Money request sent successfully")
                    .amount(request.getAmount())
                    .targetId(request.getTargetId())
                    .build();

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Request transaction failed: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * Fetch "Lista Tranzactii" with filters
     * GET /api/trans/history
     */
    @GetMapping("/history")
    public ResponseEntity<List<TransactionDto>> getTransactionHistory(
            @RequestHeader("Authorization") String token,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) String direction, // "in" or "out"
            @RequestParam UUID userId) {

        log.info("Fetching transaction history for user ID: {}", userId);

        try {
            List<TransactionDto> transactions = transactionService.getTransactionsByUserId(userId);

            // Apply filters if provided
            if (month != null) {
                transactions = transactions.stream()
                        .filter(t -> t.getCreatedAt().getMonthValue() == month)
                        .toList();
            }

            // Direction filter would require checking if account is source or destination
            // Simplified for now

            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            log.error("Failed to fetch transaction history: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * Get transaction by ID
     * GET /api/trans/{transactionId}
     */
    @GetMapping("/{transactionId}")
    public ResponseEntity<TransactionDto> getTransaction(
            @RequestHeader("Authorization") String token,
            @PathVariable Integer transactionId) {

        log.info("Fetching transaction ID: {}", transactionId);

        try {
            TransactionDto transaction = transactionService.getTransactionById(transactionId);
            return ResponseEntity.ok(transaction);
        } catch (Exception e) {
            log.error("Failed to fetch transaction: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * Get transactions by date range
     * GET /api/trans/range
     */
    @GetMapping("/range")
    public ResponseEntity<List<TransactionDto>> getTransactionsByDateRange(
            @RequestHeader("Authorization") String token,
            @RequestParam Integer accountId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        log.info("Fetching transactions for account {} between {} and {}", accountId, startDate, endDate);

        try {
            List<TransactionDto> transactions = transactionService.getTransactionsByDateRange(accountId, startDate, endDate);
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            log.error("Failed to fetch transactions: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    // Helper DTOs
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SendMoneyRequest {
        private Integer sourceAccountId;
        private Integer recipientId;
        private String recipientAccountNumber;
        private java.math.BigDecimal amount;
        private String currency;
        private String description;
        private java.util.List<Double> voiceFingerprint;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class RequestMoneyRequest {
        private Integer targetId;
        private java.math.BigDecimal amount;
        private String description;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class RequestMoneyResponse {
        private Integer requestId;
        private String status;
        private String message;
        private java.math.BigDecimal amount;
        private Integer targetId;
    }
}

