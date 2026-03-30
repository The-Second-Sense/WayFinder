package com.example.backend_wayfinder.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for voice fingerprint extraction
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FingerprintExtractionResponse {

    /**
     * Whether fingerprint extraction was successful
     */
    private boolean success;

    /**
     * 512-dimensional voice fingerprint vector
     */
    private List<Double> fingerprint;

    /**
     * Dimension of the fingerprint vector (should be 512)
     */
    private int dimension;

    /**
     * Error message if extraction failed
     */
    private String message;
}

