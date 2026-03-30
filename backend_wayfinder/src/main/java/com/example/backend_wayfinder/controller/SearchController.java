package com.example.backend_wayfinder.controller;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.BeneficiaryDto;
import com.example.backend_wayfinder.service.BeneficiaryService;
import com.example.backend_wayfinder.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SearchController {

    private final BeneficiaryService beneficiaryService;
    private final UserService userService;

    /**
     * Find recipients by name for Send/Request
     * GET /api/users/search
     */
    @GetMapping("/search")
    public ResponseEntity<List<SearchResultDto>> searchUsers(
            @RequestHeader("Authorization") String token,
            @RequestParam String query,
            @RequestParam UUID userId) {

        log.info("Searching for recipients with query: {}", query);

        try {
            // Search in beneficiaries first
            List<BeneficiaryDto> beneficiaries = beneficiaryService.getBeneficiariesByUserId(userId);

            // Filter by query (nickname or official name)
            List<SearchResultDto> results = beneficiaries.stream()
                    .filter(b -> b.getNickname().toLowerCase().contains(query.toLowerCase()) ||
                                b.getOfficialName().toLowerCase().contains(query.toLowerCase()))
                    .map(b -> SearchResultDto.builder()
                            .id(b.getBeneficiaryId())
                            .name(b.getNickname())
                            .officialName(b.getOfficialName())
                            .accountNumber(b.getTargetAccountNumber())
                            .type("BENEFICIARY")
                            .build())
                    .toList();

            return ResponseEntity.ok(results);
        } catch (Exception e) {
            log.error("Search failed: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    // Helper DTO
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SearchResultDto {
        private Integer id;
        private String name;
        private String officialName;
        private String accountNumber;
        private String type;
    }
}

