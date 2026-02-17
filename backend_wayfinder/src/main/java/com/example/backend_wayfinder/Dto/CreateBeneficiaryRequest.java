package com.example.backend_wayfinder.Dto;


import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBeneficiaryRequest {

    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotBlank(message = "Nickname is required")
    @Size(min = 2, max = 50, message = "Nickname must be between 2 and 50 characters")
    private String nickname;

    @NotBlank(message = "Official name is required")
    @Size(min = 2, max = 100, message = "Official name must be between 2 and 100 characters")
    private String officialName;

    @NotBlank(message = "Target account number is required")
    private String targetAccountNumber;

    private String targetBankCode;

    private String phoneNumber;
}
