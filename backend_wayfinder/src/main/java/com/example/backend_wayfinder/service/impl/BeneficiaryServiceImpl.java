package com.example.backend_wayfinder.service.impl;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.BeneficiaryDto;
import com.example.backend_wayfinder.Dto.CreateBeneficiaryRequest;
import com.example.backend_wayfinder.Dto.UpdateBeneficiaryRequest;
import com.example.backend_wayfinder.entities.BeneficiaryEntity;
import com.example.backend_wayfinder.entities.UserEntity;
import com.example.backend_wayfinder.repository.BeneficiaryRepository;
import com.example.backend_wayfinder.repository.UserRepository;
import com.example.backend_wayfinder.service.BeneficiaryService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class BeneficiaryServiceImpl implements BeneficiaryService {

    private final BeneficiaryRepository beneficiaryRepository;
    private final UserRepository userRepository;

    @Override
    public BeneficiaryDto createBeneficiary(CreateBeneficiaryRequest request) {
        log.info("Creating beneficiary with nickname: {} for user ID: {}", request.getNickname(), request.getUserId());

        UserEntity user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (beneficiaryRepository.existsByUser_UserIdAndNickname(user.getUserId(), request.getNickname())) {
            throw new RuntimeException("Beneficiary with nickname '" + request.getNickname() + "' already exists");
        }

        BeneficiaryEntity beneficiary = BeneficiaryEntity.builder()
                .user(user)
                .nickname(request.getNickname())
                .officialName(request.getOfficialName())
                .targetAccountNumber(request.getTargetAccountNumber())
                .targetBankCode(request.getTargetBankCode())
                .phoneNumber(request.getPhoneNumber()) // NEW: Save phone number
                .build();

        BeneficiaryEntity savedBeneficiary = beneficiaryRepository.save(beneficiary);
        log.info("Beneficiary created successfully with ID: {}", savedBeneficiary.getBeneficiaryId());

        return convertToDto(savedBeneficiary);
    }

    @Override
    public void deleteBeneficiary(Integer beneficiaryId, UUID userId) {
        log.info("Deleting beneficiary ID: {} for user ID: {}", beneficiaryId, userId);

        BeneficiaryEntity beneficiary = beneficiaryRepository.findById(beneficiaryId)
                .orElseThrow(() -> new RuntimeException("Beneficiary not found"));

        if (!beneficiary.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Beneficiary does not belong to user");
        }

        beneficiaryRepository.delete(beneficiary);
        log.info("Beneficiary deleted successfully");
    }

    @Override
    public BeneficiaryDto getBeneficiaryById(Integer beneficiaryId) {
        BeneficiaryEntity beneficiary = beneficiaryRepository.findById(beneficiaryId)
                .orElseThrow(() -> new RuntimeException("Beneficiary not found"));
        return convertToDto(beneficiary);
    }

    @Override
    public List<BeneficiaryDto> getBeneficiariesByUserId(UUID userId) {
        List<BeneficiaryEntity> beneficiaries = beneficiaryRepository.findByUser_UserId(userId);
        return beneficiaries.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public BeneficiaryDto getBeneficiaryByNickname(UUID userId, String nickname) {
        BeneficiaryEntity beneficiary = beneficiaryRepository.findByUser_UserIdAndNickname(userId, nickname)
                .orElseThrow(() -> new RuntimeException("Beneficiary with nickname '" + nickname + "' not found"));

        return convertToDto(beneficiary);
    }

    // NEW: Get beneficiary by phone number
    @Override
    public BeneficiaryDto getBeneficiaryByPhoneNumber(UUID userId, String phoneNumber) {
        BeneficiaryEntity beneficiary = beneficiaryRepository.findByUser_UserIdAndPhoneNumber(userId, phoneNumber)
                .orElseThrow(() -> new RuntimeException("Beneficiary with phone number '" + phoneNumber + "' not found"));

        return convertToDto(beneficiary);
    }

    @Override
    public BeneficiaryDto updateBeneficiary(Integer beneficiaryId, UUID userId, UpdateBeneficiaryRequest request) {
        log.info("Updating beneficiary ID: {} for user ID: {}", beneficiaryId, userId);

        BeneficiaryEntity beneficiary = beneficiaryRepository.findById(beneficiaryId)
                .orElseThrow(() -> new RuntimeException("Beneficiary not found"));

        if (!beneficiary.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Beneficiary does not belong to user");
        }


        if (request.getNickname() != null) {
            if (beneficiaryRepository.existsByUser_UserIdAndNickname(beneficiary.getUser().getUserId(), request.getNickname())
                    && !beneficiary.getNickname().equals(request.getNickname())) {
                throw new RuntimeException("Beneficiary with nickname '" + request.getNickname() + "' already exists");
            }
            beneficiary.setNickname(request.getNickname());
        }

        if (request.getOfficialName() != null) {
            beneficiary.setOfficialName(request.getOfficialName());
        }

        if (request.getTargetAccountNumber() != null) {
            beneficiary.setTargetAccountNumber(request.getTargetAccountNumber());
        }

        if (request.getTargetBankCode() != null) {
            beneficiary.setTargetBankCode(request.getTargetBankCode());
        }

        BeneficiaryEntity updatedBeneficiary = beneficiaryRepository.save(beneficiary);
        log.info("Beneficiary updated successfully");

        return convertToDto(updatedBeneficiary);
    }

    @Override
    public boolean beneficiaryExists(UUID userId, String nickname) {
        return beneficiaryRepository.existsByUser_UserIdAndNickname(userId, nickname);
    }

    @Override
    public boolean beneficiaryBelongsToUser(Integer beneficiaryId, UUID userId) {
        return beneficiaryRepository.findById(beneficiaryId)
                .map(beneficiary -> beneficiary.getUser().getUserId().equals(userId))
                .orElse(false);
    }

    // Helper method
    private BeneficiaryDto convertToDto(BeneficiaryEntity beneficiary) {
        return BeneficiaryDto.builder()
                .beneficiaryId(beneficiary.getBeneficiaryId())
                .userId(beneficiary.getUser().getUserId())
                .nickname(beneficiary.getNickname())
                .officialName(beneficiary.getOfficialName())
                .targetAccountNumber(beneficiary.getTargetAccountNumber())
                .targetBankCode(beneficiary.getTargetBankCode())
                .phoneNumber(beneficiary.getPhoneNumber()) // NEW: Map phone number
                .build();
    }
}
