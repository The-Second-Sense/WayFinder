package com.example.backend_wayfinder.Dto;


import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAccountRequest {

    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotBlank(message = "Account type is required")
    private String accountType; // e.g., "CHECKING", "SAVINGS"

    @Builder.Default
    private String currency ="RON";
}
