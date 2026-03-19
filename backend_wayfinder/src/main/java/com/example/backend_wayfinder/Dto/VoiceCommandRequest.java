package com.example.backend_wayfinder.Dto;


import java.util.UUID;
import com.example.backend_wayfinder.enums.AiMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoiceCommandRequest {

    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotBlank(message = "Voice command transcript is required")
    private String voiceCommandTranscript;

    @NotNull(message = "AI mode is required (GUIDE or AGENT)")
    private AiMode aiMode;

    // Voice fingerprint for authentication (512 dimensions)
    private List<Double> voiceFingerprint;

    // Optional: Raw audio bytes if processing is needed
    private byte[] audioData;

    // Pre-computed intent & entities from the security agent (avoids a second model call)
    private String precomputedIntent;
    private Map<String, Object> precomputedEntities;

    // Optional: phonebook contacts from frontend for beneficiary resolution
    private List<ContactLiteDto> contacts;
}

