package com.example.backend_wayfinder.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillDto {
    private UUID id;
    private UUID userId;
    private UUID providerId;
    private String billName;
    private BigDecimal amount;
    private String currency;
    private LocalDate dueDate;
    private String status; // PENDING, PAID, OVERDUE
    private String accountNumber;
    private String description;

    // Optional: Include provider details for convenience
    private String providerName; // e.g., "Digi (RCS & RDS)"
    private String providerCategory; // e.g., "internet"
}

