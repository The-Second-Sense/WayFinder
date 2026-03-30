package com.example.backend_wayfinder.controller;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.BeneficiaryDto;
import com.example.backend_wayfinder.Dto.CreateBeneficiaryRequest;
import com.example.backend_wayfinder.Dto.UpdateBeneficiaryRequest;
import com.example.backend_wayfinder.service.BeneficiaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/beneficiaries")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class BeneficiaryController {

    private final BeneficiaryService beneficiaryService;

    /**
     * Add a new beneficiary
     * POST /api/beneficiaries
     *
     * Request body:
     * {
     *   "userId": "uuid",
     *   "nickname": "Andrei",
     *   "officialName": "Andrei Popescu",
     *   "targetAccountNumber": "RO12BANK1234567890",
     *   "targetBankCode": "BANK"
     * }
     */
    @PostMapping
    public ResponseEntity<BeneficiaryDto> addBeneficiary(
            @RequestHeader(value = "Authorization", required = false) String token,
            @Valid @RequestBody CreateBeneficiaryRequest request) {

        log.info("Adding beneficiary: {} for user ID: {}", request.getNickname(), request.getUserId());

        try {
            BeneficiaryDto beneficiary = beneficiaryService.createBeneficiary(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(beneficiary);
        } catch (RuntimeException e) {
            log.error("Failed to add beneficiary: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Get all beneficiaries for a user
     * GET /api/beneficiaries?userId={userId}
     */
    @GetMapping
    public ResponseEntity<List<BeneficiaryDto>> getBeneficiaries(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestParam UUID userId) {

        log.info("Fetching beneficiaries for user: {}", userId);

        try {
            List<BeneficiaryDto> beneficiaries = beneficiaryService.getBeneficiariesByUserId(userId);
            return ResponseEntity.ok(beneficiaries);
        } catch (RuntimeException e) {
            log.error("Failed to fetch beneficiaries: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Get a specific beneficiary by ID
     * GET /api/beneficiaries/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<BeneficiaryDto> getBeneficiary(
            @RequestHeader(value = "Authorization", required = false) String token,
            @PathVariable Integer id) {

        log.info("Fetching beneficiary ID: {}", id);

        try {
            BeneficiaryDto beneficiary = beneficiaryService.getBeneficiaryById(id);
            return ResponseEntity.ok(beneficiary);
        } catch (RuntimeException e) {
            log.error("Beneficiary not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get beneficiary by nickname
     * GET /api/beneficiaries/by-nickname?userId={userId}&nickname={nickname}
     */
    @GetMapping("/by-nickname")
    public ResponseEntity<BeneficiaryDto> getBeneficiaryByNickname(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestParam UUID userId,
            @RequestParam String nickname) {

        log.info("Fetching beneficiary by nickname: {} for user: {}", nickname, userId);

        try {
            BeneficiaryDto beneficiary = beneficiaryService.getBeneficiaryByNickname(userId, nickname);
            return ResponseEntity.ok(beneficiary);
        } catch (RuntimeException e) {
            log.error("Beneficiary not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get beneficiary by phone number
     * GET /api/beneficiaries/by-phone?userId={userId}&phoneNumber={phoneNumber}
     */
    @GetMapping("/by-phone")
    public ResponseEntity<BeneficiaryDto> getBeneficiaryByPhone(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestParam UUID userId,
            @RequestParam String phoneNumber) {

        log.info("Fetching beneficiary by phone: {} for user: {}", phoneNumber, userId);

        try {
            BeneficiaryDto beneficiary = beneficiaryService.getBeneficiaryByPhoneNumber(userId, phoneNumber);
            return ResponseEntity.ok(beneficiary);
        } catch (RuntimeException e) {
            log.error("Beneficiary not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Update a beneficiary
     * PUT /api/beneficiaries/{id}
     *
     * Request body:
     * {
     *   "nickname": "Andrei Updated",
     *   "officialName": "Andrei Popescu",
     *   "targetAccountNumber": "RO12BANK1234567890",
     *   "targetBankCode": "BANK"
     * }
     */
    @PutMapping("/{id}")
    public ResponseEntity<BeneficiaryDto> updateBeneficiary(
            @RequestHeader(value = "Authorization", required = false) String token,
            @PathVariable Integer id,
            @RequestParam UUID userId,
            @Valid @RequestBody UpdateBeneficiaryRequest request) {

        log.info("Updating beneficiary ID: {} for user: {}", id, userId);

        try {
            BeneficiaryDto beneficiary = beneficiaryService.updateBeneficiary(id, userId, request);
            return ResponseEntity.ok(beneficiary);
        } catch (RuntimeException e) {
            log.error("Failed to update beneficiary: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Delete a beneficiary
     * DELETE /api/beneficiaries/{id}?userId={userId}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteBeneficiary(
            @RequestHeader(value = "Authorization", required = false) String token,
            @PathVariable Integer id,
            @RequestParam UUID userId) {

        log.info("Deleting beneficiary ID: {} for user: {}", id, userId);

        try {
            beneficiaryService.deleteBeneficiary(id, userId);
            return ResponseEntity.ok("Beneficiary deleted successfully");
        } catch (RuntimeException e) {
            log.error("Failed to delete beneficiary: {}", e.getMessage());
            throw e;
        }
    }
}

