package com.example.backend_wayfinder.Dto;

import com.example.backend_wayfinder.enums.AiMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Request to process voice audio through the complete pipeline:
 * 1. Voice authentication
 * 2. Transcription
 * 3. Intent classification
 * 4. Action execution (if AGENT mode)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessVoiceRequest {

    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotBlank(message = "Audio data is required")
    private String audioBase64;  // Base64 encoded audio file (.wav, .m4a, .mp3)

    @NotNull(message = "AI mode is required")
    private AiMode aiMode;  // GUIDE or AGENT

    /**
     * Optional: user's phonebook contacts sent from frontend.
     * Used for voice beneficiary resolution. Never persisted — cached for 15 min max.
     * Max 2000 entries enforced server-side.
     */
    private List<ContactLiteDto> contacts;
}

