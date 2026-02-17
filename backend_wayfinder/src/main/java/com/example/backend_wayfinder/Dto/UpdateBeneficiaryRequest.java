package com.example.backend_wayfinder.Dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBeneficiaryRequest {

    @Size(min = 2, max = 50, message = "Nickname must be between 2 and 50 characters")
    private String nickname;

    @Size(min = 2, max = 100, message = "Official name must be between 2 and 100 characters")
    private String officialName;

    private String targetAccountNumber;

    private String targetBankCode;
}

