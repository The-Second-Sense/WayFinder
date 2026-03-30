package com.example.backend_wayfinder.service.impl;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.AccountDto;
import com.example.backend_wayfinder.Dto.CreateAccountRequest;
import com.example.backend_wayfinder.entities.AccountEntity;
import com.example.backend_wayfinder.entities.UserEntity;
import com.example.backend_wayfinder.repository.AccountRepository;
import com.example.backend_wayfinder.repository.UserRepository;
import com.example.backend_wayfinder.service.AccountService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Override
    public AccountDto createAccount(CreateAccountRequest request) {
        UserEntity user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new RuntimeException("User not found"));

        String accountNumber = generateAccountNumber();

        AccountEntity account = AccountEntity.builder()
                .user(user)
                .accountNumber(accountNumber)
                .accountType(request.getAccountType())
                .balance(new BigDecimal("100.00"))
                .currency(request.getCurrency() != null ? request.getCurrency() : "RON")
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();

        AccountEntity savedAccount = accountRepository.save(account);
        log.info("Account created - ID: {}, Balance set: {}, Balance after save: {}",
                savedAccount.getAccountId(), account.getBalance(), savedAccount.getBalance());
        return convertToDto(savedAccount);
    }

    @Override
    public AccountDto getAccountById(Integer accountId) {
        AccountEntity account = accountRepository.findById(accountId).orElseThrow(() -> new RuntimeException("Account not found"));
        return convertToDto(account);
    }

    @Override
    public List<AccountDto> getAccountsByUserId(UUID userId) {
        List<AccountEntity> accounts = accountRepository.findByUser_UserId(userId);
        return accounts.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public void closeAccount(Integer accountId, UUID userId) {
        AccountEntity account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        if (!account.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Account does not belong to user");
        }

        if (account.getBalance().compareTo(BigDecimal.ZERO) != 0) {
            throw new RuntimeException("Cannot close account with non-zero balance");
        }


        accountRepository.delete(account);
        log.info("Account {} permanently deleted/closed for user {}", accountId, userId);
    }

    @Override
    public BigDecimal getAccountBalance(Integer accountId) {
        AccountEntity account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        return account.getBalance();
    }

    @Override
    public void updateBalance(Integer accountId, BigDecimal newBalance) {
        AccountEntity account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        account.setBalance(newBalance);
        accountRepository.save(account);
    }

    @Override
    public boolean accountBelongsToUser(Integer accountId, UUID userId) {
        return accountRepository.findById(accountId)
                .map(account -> account.getUser().getUserId().equals(userId))
                .orElse(false);
    }

    @Override
    public boolean hasSufficientBalance(Integer accountId, BigDecimal amount) {
        return accountRepository.findById(accountId)
                .map(account -> account.getBalance().compareTo(amount) >= 0)
                .orElse(false);
    }

    @Override
    public void deactivateAccount(Integer accountId, String reason) {
        AccountEntity account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        account.setIsActive(false);
        accountRepository.save(account);
        log.info("Account {} deactivated. Reason: {}", accountId, reason != null ? reason : "No reason provided");
    }

    @Override
    public void activateAccount(Integer accountId) {
        AccountEntity account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        account.setIsActive(true);
        accountRepository.save(account);
    }

    @Override
    public boolean isAccountActive(Integer accountId) {
        return accountRepository.findById(accountId)
                .map(AccountEntity::getIsActive)
                .orElse(false);
    }


    private String generateAccountNumber() {
        // Generate a 10-digit account number
        Random random = new Random();
        StringBuilder accountNumber = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            accountNumber.append(random.nextInt(10));
        }


        while (accountRepository.existsByAccountNumber(accountNumber.toString())) {
            accountNumber = new StringBuilder();
            for (int i = 0; i < 10; i++) {
                accountNumber.append(random.nextInt(10));
            }
        }

        return accountNumber.toString();
    }

    private AccountDto convertToDto(AccountEntity account) {
        return AccountDto.builder()
                .accountId(account.getAccountId())
                .userId(account.getUser().getUserId())
                .accountNumber(account.getAccountNumber())
                .accountType(account.getAccountType())
                .currency(account.getCurrency())
                .balance(account.getBalance())
                .isActive(account.getIsActive())
                .createdAt(account.getCreatedAt())
                .build();
    }
}
