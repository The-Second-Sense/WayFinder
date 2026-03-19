package com.example.backend_wayfinder.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmTransferRequest {
    private UUID userId;
    private boolean confirmed;
    private String targetAccountNumber;
    private BigDecimal amount;
    private String currency;
    private String description;
}
