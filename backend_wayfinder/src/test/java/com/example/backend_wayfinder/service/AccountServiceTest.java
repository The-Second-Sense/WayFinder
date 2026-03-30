package com.example.backend_wayfinder.service;

import com.example.backend_wayfinder.Dto.CreateAccountRequest;
import com.example.backend_wayfinder.Dto.AccountDto;
import com.example.backend_wayfinder.entities.AccountEntity;
import com.example.backend_wayfinder.entities.UserEntity;
import com.example.backend_wayfinder.repository.AccountRepository;
import com.example.backend_wayfinder.repository.UserRepository;
import com.example.backend_wayfinder.service.impl.AccountServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AccountServiceImpl accountService;

    private UUID testUserId;
    private UserEntity testUser;
    private AccountEntity testAccount;
    private CreateAccountRequest createRequest;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();

        testUser = UserEntity.builder()
                .userId(testUserId)
                .email("test@example.com")
                .fullName("Test User")
                .build();

        testAccount = AccountEntity.builder()
                .accountId(1)
                .user(testUser)  // Use user relationship instead of userId
                .accountNumber("RO49AAAA1B31007593840000")
                .accountType("CHECKING")
                .currency("RON")
                .balance(new BigDecimal("1000.00"))
                .isActive(true)
                .build();

        createRequest = CreateAccountRequest.builder()
                .userId(testUserId)
                .accountType("SAVINGS")
                .currency("EUR")
                .build();
    }

    @Test
    void testCreateAccount_Success() {
        // Given
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(accountRepository.save(any(AccountEntity.class)))
                .thenAnswer(invocation -> {
                    AccountEntity account = invocation.getArgument(0);
                    account.setAccountId(1);
                    account.setAccountNumber("RO49BBBB1B31007593840000");
                    return account;
                });

        // When
        AccountDto result = accountService.createAccount(createRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getAccountType()).isEqualTo("SAVINGS");
        assertThat(result.getCurrency()).isEqualTo("EUR");
        assertThat(result.getBalance()).isEqualByComparingTo(BigDecimal.ZERO);
        verify(accountRepository).save(any(AccountEntity.class));
    }

    @Test
    void testCreateAccount_UserNotFound_ThrowsException() {
        // Given
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> accountService.createAccount(createRequest))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");

        verify(accountRepository, never()).save(any());
    }

    @Test
    void testGetAccountById_Success() {
        // Given
        when(accountRepository.findById(1)).thenReturn(Optional.of(testAccount));

        // When
        AccountDto result = accountService.getAccountById(1);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getAccountId()).isEqualTo(1);
        assertThat(result.getAccountNumber()).isEqualTo(testAccount.getAccountNumber());
    }

    @Test
    void testGetAccountById_NotFound_ThrowsException() {
        // Given
        when(accountRepository.findById(1)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> accountService.getAccountById(1))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Account not found");
    }

    @Test
    void testGetAccountsByUserId_Success() {
        // Given
        List<AccountEntity> accounts = Arrays.asList(testAccount);
        when(accountRepository.findByUser_UserId(testUserId)).thenReturn(accounts);

        // When
        List<AccountDto> result = accountService.getAccountsByUserId(testUserId);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getAccountNumber()).isEqualTo(testAccount.getAccountNumber());
    }


    @Test
    void testDeactivateAccount_Success() {
        // Given
        when(accountRepository.findById(1)).thenReturn(Optional.of(testAccount));
        when(accountRepository.save(any(AccountEntity.class))).thenReturn(testAccount);

        // When
        accountService.deactivateAccount(1, "Testing");

        // Then
        assertThat(testAccount.getIsActive()).isFalse();
        verify(accountRepository).save(testAccount);
    }

    @Test
    void testActivateAccount_Success() {
        // Given
        testAccount.setIsActive(false);
        when(accountRepository.findById(1)).thenReturn(Optional.of(testAccount));
        when(accountRepository.save(any(AccountEntity.class))).thenReturn(testAccount);

        // When
        accountService.activateAccount(1);

        // Then
        assertThat(testAccount.getIsActive()).isTrue();
        verify(accountRepository).save(testAccount);
    }

    @Test
    void testGetAccountBalance_Success() {
        // Given
        when(accountRepository.findById(1)).thenReturn(Optional.of(testAccount));

        // When
        BigDecimal balance = accountService.getAccountBalance(1);

        // Then
        assertThat(balance).isEqualByComparingTo(new BigDecimal("1000.00"));
    }

    @Test
    void testUpdateBalance_Success() {
        // Given
        when(accountRepository.findById(1)).thenReturn(Optional.of(testAccount));
        when(accountRepository.save(any(AccountEntity.class))).thenReturn(testAccount);

        // When
        accountService.updateBalance(1, new BigDecimal("500.00"));

        // Then
        assertThat(testAccount.getBalance()).isEqualByComparingTo(new BigDecimal("500.00"));
        verify(accountRepository).save(testAccount);
    }

    @Test
    void testCloseAccount_Success() {
        // Given
        testAccount.setBalance(BigDecimal.ZERO);
        when(accountRepository.findById(1)).thenReturn(Optional.of(testAccount));
        when(accountRepository.save(any(AccountEntity.class))).thenReturn(testAccount);

        // When
        accountService.closeAccount(1, testUserId);

        // Then
        assertThat(testAccount.getIsActive()).isFalse();
        verify(accountRepository).save(testAccount);
    }

    @Test
    void testCloseAccount_NonZeroBalance_ThrowsException() {
        // Given
        when(accountRepository.findById(1)).thenReturn(Optional.of(testAccount));

        // When/Then
        assertThatThrownBy(() -> accountService.closeAccount(1, testUserId))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cannot close account with non-zero balance");

        verify(accountRepository, never()).save(any());
    }

    @Test
    void testAccountBelongsToUser_Success() {
        // Given
        when(accountRepository.findById(1)).thenReturn(Optional.of(testAccount));

        // When
        boolean result = accountService.accountBelongsToUser(1, testUserId);

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void testHasSufficientBalance_Success() {
        // Given
        when(accountRepository.findById(1)).thenReturn(Optional.of(testAccount));

        // When
        boolean result = accountService.hasSufficientBalance(1, new BigDecimal("500.00"));

        // Then
        assertThat(result).isTrue();
    }

    @Test
    void testIsAccountActive_Success() {
        // Given
        when(accountRepository.findById(1)).thenReturn(Optional.of(testAccount));

        // When
        boolean result = accountService.isAccountActive(1);

        // Then
        assertThat(result).isTrue();
    }
}

