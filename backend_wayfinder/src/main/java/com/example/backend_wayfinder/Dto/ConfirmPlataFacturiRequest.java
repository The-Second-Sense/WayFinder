package com.example.backend_wayfinder.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmPlataFacturiRequest {
    @NotNull
    private UUID userId;

    @NotNull
    private boolean confirmed;

    @NotBlank
    @Size(min = 5, max = 20)
    private String targetAccountNumber;

    @NotNull
    @JsonProperty("amount")
    private BigDecimal amount;

    @NotBlank
    @Size(min = 2, max = 3)
    private String currency;

    private String description;
}
