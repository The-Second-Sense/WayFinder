package com.example.backend_wayfinder.Dto;


import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountDto {
    private Integer accountId;
    private UUID userId;
    private String accountNumber;
    private String accountType;
    private String currency;
    private BigDecimal balance;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
