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
public class TransactionDto {
    private Integer id;
    private Integer sourceAccountId;
    private String destinationAccountNumber;
    private BigDecimal amount;
    private String currency;
    private String description;
    private String status;
    private String initiatedBy;
    private LocalDateTime createdAt;
}

