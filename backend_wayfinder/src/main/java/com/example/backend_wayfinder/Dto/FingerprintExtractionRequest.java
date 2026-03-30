package com.example.backend_wayfinder.Dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for voice fingerprint extraction from audio
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FingerprintExtractionRequest {

    /**
     * Base64 encoded audio file (M4A, WAV, MP3, etc.)
     */
    @NotBlank(message = "Audio data is required")
    private String audioBase64;
}

