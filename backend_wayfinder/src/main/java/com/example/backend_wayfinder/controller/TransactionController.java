package com.example.backend_wayfinder.controller;

import java.util.List;
import java.util.UUID;

import com.example.backend_wayfinder.Dto.CreateTransactionRequest;
import com.example.backend_wayfinder.Dto.TransactionDto;
import com.example.backend_wayfinder.entities.AccountEntity;
import com.example.backend_wayfinder.repository.AccountRepository;
import com.example.backend_wayfinder.repository.UserRepository;
import com.example.backend_wayfinder.service.JwtService;
import com.example.backend_wayfinder.service.TransactionService;
import com.example.backend_wayfinder.exception.InsufficientBalanceException;
import com.example.backend_wayfinder.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/trans")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class TransactionController {

    private final TransactionService transactionService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;

    /**
     * Send money
     * POST /api/trans/send
     * Body: {
     *   sourceAccountId (optional — auto-resolved from JWT if absent),
     *   recipientAccountNumber,
     *   amount,
     *   currency (optional, defaults to RON),
     *   description (optional),
     *   voiceFingerprint (optional — only used if user has voice auth enabled)
     * }
     */
    @PostMapping("/send")
    public ResponseEntity<TransactionDto> sendMoney(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody SendMoneyRequest request) {

        log.info("Processing send transaction: {} {}", request.getAmount(), request.getCurrency());

        // Resolve sourceAccountId from JWT when not provided by the frontend
        Integer sourceAccountId = request.getSourceAccountId();
        String email = null;
        if (sourceAccountId == null) {
            email = jwtService.extractUsername(token.replace("Bearer ", "").trim());
            sourceAccountId = userRepository.findByEmail(email)
                    .flatMap(user -> accountRepository
                            .findByUser_UserIdAndIsActive(user.getUserId(), true)
                            .stream().findFirst())
                    .map(a -> a.getAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("No active account found for user"));
            log.info("Auto-resolved sourceAccountId: {}", sourceAccountId);
        } else {
            // Get email from account
            email = accountRepository.findById(sourceAccountId)
                    .map(acc -> acc.getUser().getEmail())
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        }

        // Validate PIN before processing transfer
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.getTransferPin().equals(request.getTransferPin())) {
            log.warn("Invalid transfer PIN for user: {}", email);
            throw new IllegalArgumentException("Invalid transfer PIN");
        }
        log.info("Transfer PIN validated for user: {}", email);

        // Resolve recipient: phone number takes precedence if IBAN not supplied
        String destinationAccountNumber = request.getRecipientAccountNumber();
        String recipientIdentifier = destinationAccountNumber; // For error messages

        if ((destinationAccountNumber == null || destinationAccountNumber.isBlank())
                && request.getRecipientPhoneNumber() != null && !request.getRecipientPhoneNumber().isBlank()) {

            String phone = request.getRecipientPhoneNumber().trim();
            recipientIdentifier = phone;

            try {
                AccountEntity recipientAccount = accountRepository
                        .findActiveAccountsByUserPhoneNumber(phone)
                        .stream()
                        .findFirst()
                        .orElse(null);

                if (recipientAccount != null) {
                    destinationAccountNumber = recipientAccount.getAccountNumber();
                    log.info("Resolved phone {} to account number {}", phone, destinationAccountNumber);
                } else {
                    // Phone not found in system - ask for IBAN
                    log.info("Phone number {} not found in system. Asking for IBAN.", phone);
                    throw new IllegalArgumentException(
                        "Numărul de telefon " + phone + " nu este găsit pe Wayfinder. Te rog introdu IBAN-ul pentru transfer extern."
                    );
                }
            } catch (Exception e) {
                if (e instanceof IllegalArgumentException) throw e;
                log.warn("Error resolving phone number: {}", phone, e);
                throw new IllegalArgumentException(
                    "Eroare la rezolvarea numărului de telefon. Te rog introdu IBAN-ul pentru transfer extern."
                );
            }
        }

        if (destinationAccountNumber == null || destinationAccountNumber.isBlank()) {
            throw new IllegalArgumentException(
                "Either recipientAccountNumber or recipientPhoneNumber must be provided"
            );
        }

        CreateTransactionRequest txRequest = CreateTransactionRequest.builder()
                .sourceAccountId(sourceAccountId)
                .destinationAccountNumber(destinationAccountNumber)
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : "RON")
                .description(request.getDescription())
                .initiatedBy("USER")
                .currentVoiceFingerprint(request.getVoiceFingerprint())
                .build();

        TransactionDto transaction = transactionService.createTransaction(txRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(transaction);
    }

    /**
     * Get transaction history for a user
     * GET /api/trans/history?userId=&month=&direction=
     */
    @GetMapping("/history")
    public ResponseEntity<List<TransactionDto>> getTransactionHistory(
            @RequestHeader("Authorization") String token,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) String direction,
            @RequestParam UUID userId) {

        log.info("Fetching transaction history for user: {}", userId);

        List<TransactionDto> transactions = transactionService.getTransactionsByUserId(userId);

        if (month != null) {
            transactions = transactions.stream()
                    .filter(t -> t.getCreatedAt().getMonthValue() == month)
                    .toList();
        }

        if (direction != null) {
            String dir = direction.toUpperCase();
            transactions = transactions.stream()
                    .filter(t -> dir.equals(t.getDirection()))
                    .toList();
        }

        return ResponseEntity.ok(transactions);
    }

    /**
     * Get single transaction
     * GET /api/trans/{transactionId}
     */
    @GetMapping("/{transactionId}")
    public ResponseEntity<TransactionDto> getTransaction(
            @RequestHeader("Authorization") String token,
            @PathVariable Integer transactionId) {

        log.info("Fetching transaction ID: {}", transactionId);
        TransactionDto transaction = transactionService.getTransactionById(transactionId);
        return ResponseEntity.ok(transaction);
    }

    /**
     * Get transactions by date range for an account
     * GET /api/trans/range?accountId=&startDate=&endDate=
     */
    @GetMapping("/range")
    public ResponseEntity<List<TransactionDto>> getTransactionsByDateRange(
            @RequestHeader("Authorization") String token,
            @RequestParam Integer accountId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        log.info("Fetching transactions for account {} between {} and {}", accountId, startDate, endDate);
        List<TransactionDto> transactions = transactionService.getTransactionsByDateRange(accountId, startDate, endDate);
        return ResponseEntity.ok(transactions);
    }

    // ── Inner request DTO ────────────────────────────────────────────────────

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SendMoneyRequest {
        /** Optional — auto-resolved from JWT if not provided */
        private Integer sourceAccountId;
        /** Either recipientAccountNumber OR recipientPhoneNumber must be provided */
        private String recipientAccountNumber;
        /** Alternative to IBAN — resolved to the recipient's first active account */
        private String recipientPhoneNumber;
        @jakarta.validation.constraints.NotNull
        @jakarta.validation.constraints.DecimalMin("0.01")
        private java.math.BigDecimal amount;
        /** Optional — defaults to RON */
        private String currency;
        /** Optional */
        private String description;
        /** Required — transfer PIN for security */
        @jakarta.validation.constraints.NotBlank(message = "Transfer PIN is required")
        private String transferPin;
        /** Optional — only validated if user has voice auth enabled */
        private java.util.List<Double> voiceFingerprint;
    }
}
