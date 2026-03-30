package com.example.backend_wayfinder.service.impl;

import com.example.backend_wayfinder.Dto.ProviderDto;
import com.example.backend_wayfinder.entities.ProviderEntity;
import com.example.backend_wayfinder.repository.ProviderRepository;
import com.example.backend_wayfinder.service.ProviderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ProviderServiceImpl implements ProviderService {

    private final ProviderRepository providerRepository;

    private static final double FUZZY_MATCH_THRESHOLD = 0.70; // 70% similarity

    @Override
    public List<ProviderDto> getAllProviders() {
        List<ProviderEntity> providers = providerRepository.findAll();
        return providers.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public ProviderDto getProviderById(UUID providerId) {
        ProviderEntity provider = providerRepository.findById(providerId)
                .orElseThrow(() -> new RuntimeException("Provider not found with ID: " + providerId));
        return mapToDto(provider);
    }

    @Override
    public ProviderDto findProviderByNameFuzzy(String name) {
        List<ProviderEntity> allProviders = providerRepository.findAll();

        String normalized = normalizeName(name);
        log.info("Searching for provider by name: '{}' (normalized: '{}')", name, normalized);

        // First, try exact match on provider name
        for (ProviderEntity provider : allProviders) {
            String providerNameNormalized = normalizeName(provider.getName());
            if (providerNameNormalized.equalsIgnoreCase(normalized)) {
                log.info("Found exact match: {}", provider.getName());
                return mapToDto(provider);
            }
        }

        // Second, try fuzzy matching on provider name
        Map.Entry<ProviderEntity, Double> bestMatch = null;
        for (ProviderEntity provider : allProviders) {
            String providerNameNormalized = normalizeName(provider.getName());
            double similarity = calculateSimilarity(normalized, providerNameNormalized);

            if (similarity >= FUZZY_MATCH_THRESHOLD) {
                if (bestMatch == null || similarity > bestMatch.getValue()) {
                    bestMatch = new AbstractMap.SimpleEntry<>(provider, similarity);
                }
            }
        }

        if (bestMatch != null) {
            log.info("Found fuzzy match: {} (similarity: {})", bestMatch.getKey().getName(), bestMatch.getValue());
            return mapToDto(bestMatch.getKey());
        }

        // Third, try matching against keywords
        for (ProviderEntity provider : allProviders) {
            String[] keywords = provider.getKeywords().split(",");
            for (String keyword : keywords) {
                String keywordNormalized = normalizeName(keyword.trim());
                double similarity = calculateSimilarity(normalized, keywordNormalized);

                if (similarity >= FUZZY_MATCH_THRESHOLD) {
                    if (bestMatch == null || similarity > bestMatch.getValue()) {
                        bestMatch = new AbstractMap.SimpleEntry<>(provider, similarity);
                    }
                }
            }
        }

        if (bestMatch != null) {
            log.info("Found keyword match: {} (similarity: {})", bestMatch.getKey().getName(), bestMatch.getValue());
            return mapToDto(bestMatch.getKey());
        }

        log.warn("No provider found matching: '{}'", name);
        throw new RuntimeException("Provider not found for: " + name);
    }

    @Override
    public ProviderDto findProviderByKeywordFuzzy(String keyword) {
        return findProviderByNameFuzzy(keyword);
    }

    @Override
    public List<ProviderDto> searchProvidersByName(String name) {
        List<ProviderEntity> allProviders = providerRepository.findAll();

        String normalized = normalizeName(name);
        log.info("Searching for providers matching: '{}' (normalized: '{}')", name, normalized);

        List<Map.Entry<ProviderEntity, Double>> scored = new ArrayList<>();

        // Score by provider name
        for (ProviderEntity provider : allProviders) {
            String providerNameNormalized = normalizeName(provider.getName());
            double similarity = calculateSimilarity(normalized, providerNameNormalized);

            if (similarity >= FUZZY_MATCH_THRESHOLD) {
                scored.add(new AbstractMap.SimpleEntry<>(provider, similarity));
            }
        }

        // Score by keywords
        for (ProviderEntity provider : allProviders) {
            String[] keywords = provider.getKeywords().split(",");
            for (String keyword : keywords) {
                String keywordNormalized = normalizeName(keyword.trim());
                double similarity = calculateSimilarity(normalized, keywordNormalized);

                if (similarity >= FUZZY_MATCH_THRESHOLD) {
                    boolean exists = scored.stream()
                            .anyMatch(e -> e.getKey().getId().equals(provider.getId()));
                    if (!exists) {
                        scored.add(new AbstractMap.SimpleEntry<>(provider, similarity));
                    }
                }
            }
        }

        // Sort by similarity descending
        scored.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));

        List<ProviderDto> results = scored.stream()
                .map(e -> mapToDto(e.getKey()))
                .collect(Collectors.toList());

        log.info("Found {} providers matching: '{}'", results.size(), name);
        return results;
    }

    /**
     * Normalize provider name by:
     * - Converting to lowercase
     * - Removing diacritics
     * - Removing special characters
     * - Trimming whitespace
     */
    private String normalizeName(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }

        // Remove diacritics
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        normalized = normalized.replaceAll("\\p{M}", "");

        // Convert to lowercase
        normalized = normalized.toLowerCase();

        // Remove special characters, keep only alphanumeric and spaces
        normalized = normalized.replaceAll("[^a-z0-9\\s]", "");

        // Collapse multiple spaces
        normalized = normalized.replaceAll("\\s+", " ");

        return normalized.trim();
    }

    /**
     * Calculate similarity using Levenshtein distance
     * Returns a score between 0.0 and 1.0
     */
    private double calculateSimilarity(String a, String b) {
        if (a.equals(b)) {
            return 1.0;
        }

        int distance = levenshteinDistance(a, b);
        int maxLength = Math.max(a.length(), b.length());

        if (maxLength == 0) {
            return 1.0;
        }

        return 1.0 - ((double) distance / maxLength);
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
    private int levenshteinDistance(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];

        for (int i = 0; i <= a.length(); i++) {
            dp[i][0] = i;
        }

        for (int j = 0; j <= b.length(); j++) {
            dp[0][j] = j;
        }

        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(
                        Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + cost
                );
            }
        }

        return dp[a.length()][b.length()];
    }

    private ProviderDto mapToDto(ProviderEntity entity) {
        return ProviderDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .category(entity.getCategory())
                .targetAccountNumber(entity.getTargetAccountNumber())
                .keywords(entity.getKeywords())
                .build();
    }
}

