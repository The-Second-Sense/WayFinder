package com.example.backend_wayfinder.controller;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.AccountDto;
import com.example.backend_wayfinder.Dto.CreateAccountRequest;
import com.example.backend_wayfinder.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class UserController {

    private final AccountService accountService;

    /**
     * Fetch current balance for "Acasă" (Home) tab
     * GET /api/user/balance
     */
    @GetMapping("/balance")
    public ResponseEntity<BalanceResponse> getBalance(@RequestHeader("Authorization") String token) {
        log.info("Fetching balance");

        try {
            // TODO: Extract userId from token
            UUID userId = UUID.randomUUID(); // TODO: Extract from token

            List<AccountDto> accounts = accountService.getAccountsByUserId(userId);

            // Calculate total balance across all accounts
            BigDecimal totalBalance = accounts.stream()
                    .filter(AccountDto::getIsActive)
                    .map(AccountDto::getBalance)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BalanceResponse response = BalanceResponse.builder()
                    .totalBalance(totalBalance)
                    .currency("RON")
                    .accounts(accounts)
                    .build();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to fetch balance: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * List linked payment methods (accounts/cards)
     * GET /api/user/cards
     */
    @GetMapping("/cards")
    public ResponseEntity<List<AccountDto>> getCards(
            @RequestHeader("Authorization") String token,
            @RequestParam UUID userId) {

        log.info("Fetching payment methods for user ID: {}", userId);

        try {
            List<AccountDto> accounts = accountService.getAccountsByUserId(userId);
            return ResponseEntity.ok(accounts);
        } catch (Exception e) {
            log.error("Failed to fetch payment methods: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * Account details for the "Cont" (Account) tab
     * GET /api/user/profile
     */
    @GetMapping("/profile")
    public ResponseEntity<AccountDto> getProfile(
            @RequestHeader("Authorization") String token,
            @RequestParam UUID userId) {

        log.info("Fetching profile for user ID: {}", userId);

        try {
            // Get primary account
            List<AccountDto> accounts = accountService.getAccountsByUserId(userId);

            if (accounts.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // Return first active account as primary
            AccountDto primaryAccount = accounts.stream()
                    .filter(AccountDto::getIsActive)
                    .findFirst()
                    .orElse(accounts.get(0));

            return ResponseEntity.ok(primaryAccount);
        } catch (Exception e) {
            log.error("Failed to fetch profile: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * Create new account
     * POST /api/user/account
     */
    @PostMapping("/account")
    public ResponseEntity<AccountDto> createAccount(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody CreateAccountRequest request) {

        log.info("Creating account for user ID: {}", request.getUserId());

        try {
            AccountDto account = accountService.createAccount(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(account);
        } catch (Exception e) {
            log.error("Account creation failed: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * Get account by ID
     * GET /api/user/account/{accountId}
     */
    @GetMapping("/account/{accountId}")
    public ResponseEntity<AccountDto> getAccount(
            @RequestHeader("Authorization") String token,
            @PathVariable Integer accountId) {

        log.info("Fetching account ID: {}", accountId);

        try {
            AccountDto account = accountService.getAccountById(accountId);
            return ResponseEntity.ok(account);
        } catch (Exception e) {
            log.error("Failed to fetch account: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * Close account
     * DELETE /api/user/account/{accountId}
     */
    @DeleteMapping("/account/{accountId}")
    public ResponseEntity<String> closeAccount(
            @RequestHeader("Authorization") String token,
            @PathVariable Integer accountId,
            @RequestParam UUID userId) {

        log.info("Closing account ID: {} for user ID: {}", accountId, userId);

        try {
            accountService.closeAccount(accountId, userId);
            return ResponseEntity.ok("Account closed successfully");
        } catch (Exception e) {
            log.error("Failed to close account: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Helper DTO class
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class BalanceResponse {
        private BigDecimal totalBalance;
        private String currency;
        private List<AccountDto> accounts;
    }
}

