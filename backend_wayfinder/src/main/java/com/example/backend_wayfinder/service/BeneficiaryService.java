package com.example.backend_wayfinder.service;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.BeneficiaryDto;
import com.example.backend_wayfinder.Dto.CreateBeneficiaryRequest;
import com.example.backend_wayfinder.Dto.UpdateBeneficiaryRequest;

import java.util.List;

public interface BeneficiaryService {

    BeneficiaryDto createBeneficiary(CreateBeneficiaryRequest request);
    void deleteBeneficiary(Integer beneficiaryId, UUID userId);


    BeneficiaryDto getBeneficiaryById(Integer beneficiaryId);
    List<BeneficiaryDto> getBeneficiariesByUserId(UUID userId);
    BeneficiaryDto getBeneficiaryByNickname(UUID userId, String nickname);
    BeneficiaryDto getBeneficiaryByPhoneNumber(UUID userId, String phoneNumber);

    BeneficiaryDto updateBeneficiary(Integer beneficiaryId, UUID userId, UpdateBeneficiaryRequest request);

    boolean beneficiaryExists(UUID userId, String nickname);
    boolean beneficiaryBelongsToUser(Integer beneficiaryId, UUID userId);
}

