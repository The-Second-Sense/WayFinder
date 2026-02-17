package com.example.backend_wayfinder.Dto;

import lombok.Data;
import java.util.Map;

@Data
public class ModalSecurityResponse {
    private String status;  // GRANTED, DENIED, ERROR
    private Double score;
    private String transcription;
    private Map<String, Object> intent;
    private String reason;
}

