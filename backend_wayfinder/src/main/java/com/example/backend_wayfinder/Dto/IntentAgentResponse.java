package com.example.backend_wayfinder.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntentAgentResponse {
    private String intent;  // e.g., "TRANSFER", "PLATA_FACTURI", "ADAUGA_BENEFICIAR"
    private Map<String, Object> entities;  // e.g., {"SUMA": ["100"], "VALUTA": ["RON"], "BENEFICIAR": ["Andrei"]}
}

