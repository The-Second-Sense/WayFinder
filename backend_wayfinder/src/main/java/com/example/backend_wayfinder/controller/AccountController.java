package com.example.backend_wayfinder.controller;

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
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AccountController {

    private final AccountService accountService;

    /**
     * GET /api/accounts/user/{userId}
     * Returns all accounts for a user — called on page load by the frontend.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AccountDto>> getAccountsByUser(@PathVariable UUID userId) {
        log.info("Fetching accounts for user ID: {}", userId);
        try {
            List<AccountDto> accounts = accountService.getAccountsByUserId(userId);
            return ResponseEntity.ok(accounts);
        } catch (Exception e) {
            log.error("Failed to fetch accounts for user {}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/accounts/{accountId}
     * Returns a single account by its ID.
     */
    @GetMapping("/{accountId}")
    public ResponseEntity<AccountDto> getAccountById(@PathVariable Integer accountId) {
        log.info("Fetching account ID: {}", accountId);
        try {
            AccountDto account = accountService.getAccountById(accountId);
            return ResponseEntity.ok(account);
        } catch (RuntimeException e) {
            log.error("Account not found: {}", accountId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * GET /api/accounts/{accountId}/balance
     * Returns only the balance — useful for a quick balance refresh without fetching full account.
     */
    @GetMapping("/{accountId}/balance")
    public ResponseEntity<BigDecimal> getBalance(@PathVariable Integer accountId) {
        log.info("Fetching balance for account ID: {}", accountId);
        try {
            BigDecimal balance = accountService.getAccountBalance(accountId);
            return ResponseEntity.ok(balance);
        } catch (RuntimeException e) {
            log.error("Account not found: {}", accountId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * POST /api/accounts
     * Creates a new account for a user.
     * One user can have multiple accounts (e.g. CURRENT + SAVINGS).
     * Body: { "userId": "...", "accountType": "SAVINGS", "currency": "RON" }
     */
    @PostMapping
    public ResponseEntity<AccountDto> createAccount(@Valid @RequestBody CreateAccountRequest request) {
        log.info("Creating new {} account for user ID: {}", request.getAccountType(), request.getUserId());
        try {
            AccountDto account = accountService.createAccount(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(account);
        } catch (RuntimeException e) {
            log.error("Failed to create account: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * POST /api/accounts/{accountId}/close
     * Closes an account (soft delete) — can only close if balance is zero.
     * Path: accountId
     * Body: { "userId": "..." }
     */
    @PostMapping("/{accountId}/close")
    public ResponseEntity<String> closeAccount(@PathVariable Integer accountId, @RequestBody Map<String, String> request) {
        String userIdStr = request.get("userId");
        if (userIdStr == null) {
            return ResponseEntity.badRequest().body("userId is required");
        }

        try {
            UUID userId = UUID.fromString(userIdStr);
            log.info("Closing account ID: {} for user ID: {}", accountId, userId);
            accountService.closeAccount(accountId, userId);
            return ResponseEntity.ok("Account closed successfully");
        } catch (IllegalArgumentException e) {
            log.error("Invalid user ID format: {}", userIdStr);
            return ResponseEntity.badRequest().body("Invalid user ID format");
        } catch (RuntimeException e) {
            log.error("Failed to close account {}: {}", accountId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * POST /api/accounts/{accountId}/block
     * Blocks/freezes an account (temporarily) — deactivates without checking balance.
     * Path: accountId
     * Body: { "reason": "Suspicious activity" }
     */
    @PostMapping("/{accountId}/block")
    public ResponseEntity<String> blockAccount(@PathVariable Integer accountId, @RequestBody Map<String, String> request) {
        String reason = request.getOrDefault("reason", "No reason provided");
        log.info("Blocking account ID: {}, Reason: {}", accountId, reason);
        try {
            accountService.deactivateAccount(accountId, reason);
            return ResponseEntity.ok("Account blocked successfully");
        } catch (RuntimeException e) {
            log.error("Failed to block account {}: {}", accountId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * POST /api/accounts/{accountId}/unblock
     * Unblocks/unfreezes an account — reactivates it.
     * Path: accountId
     */
    @PostMapping("/{accountId}/unblock")
    public ResponseEntity<String> unblockAccount(@PathVariable Integer accountId) {
        log.info("Unblocking account ID: {}", accountId);
        try {
            accountService.activateAccount(accountId);
            return ResponseEntity.ok("Account unblocked successfully");
        } catch (RuntimeException e) {
            log.error("Failed to unblock account {}: {}", accountId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
