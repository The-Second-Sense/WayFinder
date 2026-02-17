package com.example.backend_wayfinder.Dto;


import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BeneficiaryDto {
    private Integer beneficiaryId;
    private UUID userId;
    private String nickname;
    private String officialName;
    private String targetAccountNumber;
    private String targetBankCode;
    private String phoneNumber; // NEW: Phone number field
}

