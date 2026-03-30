package com.example.backend_wayfinder.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a single step in GUIDE mode instructions
 * Frontend uses this to highlight buttons and show tooltips
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuidanceStep {

    private int stepNumber;

    // Human-readable instruction in Romanian
    private String instruction;

    // Frontend element identifier to highlight (e.g., "transfer-button", "amount-input")
    private String elementId;

    // Screen/page where this action should happen (e.g., "home", "transfer", "dashboard")
    private String screenName;

    // Expected value (if applicable, e.g., "100" for amount, "Andrei" for beneficiary)
    private String expectedValue;

    // Icon name to show (optional, e.g., "send", "person", "attach_money")
    private String icon;

    // Whether this step is completed
    private boolean completed;
}

