    package com.example.backend_wayfinder.Dto;


    import java.util.List;
    import java.util.Map;
    import java.util.UUID;
    import com.example.backend_wayfinder.enums.AiMode;
    import com.example.backend_wayfinder.enums.Intent;import lombok.AllArgsConstructor;
    import lombok.Builder;
    import lombok.Data;
    import lombok.NoArgsConstructor;

    import java.math.BigDecimal;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public class VoiceCommandResponse {

        private Integer logId;
        private AiMode aiMode;
        private Intent intent;
        private BigDecimal confidenceScore;

        // For GUIDE mode - instructions on what to do
        private String guidanceMessage;

        // NEW: Structured guidance steps for frontend
        private List<GuidanceStep> guidanceSteps;

        // For AGENT mode - confirmation of action taken
        private String actionConfirmation;

        // If action was performed (AGENT mode)
        private boolean actionPerformed;
        private String actionDetails;

        // If transaction was created
        private Integer transactionId;

        // General response message
        private String message;

        // NEW: Pending confirmation (e.g. beneficiary found but needs user to confirm)
        private boolean pendingConfirmation;
        private List<BeneficiaryDto> matchedBeneficiaries;

        private boolean success;

        // NEW: Extracted entities from voice (amounts, names, etc.)
        private Map<String, Object> extractedEntities;

        // NEW: UI hints for frontend
        private String navigateToScreen;
        private String highlightButtonId;

        // NEW: Action data for AGENT mode (transaction details, balance, etc.)
        private Map<String, Object> actionData;
    }
