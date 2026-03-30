package com.example.backend_wayfinder.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModalSecurityRequest {
    private String current_voice_base64;
    private List<Double> reference_fingerprint;
    private String intent_agent_url;
    private String deberta_url;
}

