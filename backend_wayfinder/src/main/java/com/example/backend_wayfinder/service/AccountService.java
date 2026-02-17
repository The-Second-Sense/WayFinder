package com.example.backend_wayfinder.service;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.AccountDto;
import com.example.backend_wayfinder.Dto.CreateAccountRequest;
import java.math.BigDecimal;
import java.util.List;

public interface AccountService {


    AccountDto createAccount(CreateAccountRequest request);
    AccountDto getAccountById(Integer accountId);
    List<AccountDto> getAccountsByUserId(UUID userId);
    void closeAccount(Integer accountId, UUID userId);

    // Balance operations
    BigDecimal getAccountBalance(Integer accountId);
    void updateBalance(Integer accountId, BigDecimal newBalance);

    // Account validation
    boolean accountBelongsToUser(Integer accountId, UUID userId);
    boolean hasSufficientBalance(Integer accountId, BigDecimal amount);

    // Account status management
    void deactivateAccount(Integer accountId, String reason);
    void activateAccount(Integer accountId);
    boolean isAccountActive(Integer accountId);
}
