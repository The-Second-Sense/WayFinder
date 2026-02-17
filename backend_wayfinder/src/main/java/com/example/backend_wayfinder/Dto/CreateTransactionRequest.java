package com.example.backend_wayfinder.Dto;


import java.util.UUID;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTransactionRequest {

    @NotNull(message = "Source account ID is required")
    private Integer sourceAccountId;

    @NotBlank(message = "Destination account number is required")
    private String destinationAccountNumber;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @Size(min = 3, max = 3, message = "Currency must be 3 characters")
    private String currency;

    @Size(max = 200, message = "Description cannot exceed 200 characters")
    private String description;

    @NotBlank(message = "Initiated by is required (AI or USER)")
    private String initiatedBy;


    private Integer aiInteractionLogId;

    @Size(min = 512, max = 512, message = "Voice fingerprint must be exactly 512 dimensions")
    private List<Double> currentVoiceFingerprint;
}
