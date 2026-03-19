package com.example.backend_wayfinder.Dto;


import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserDto {

    private UUID userId;
    private String email;
    private String fullName;
    private String phoneNumber;
    private Boolean isVoiceAuthEnabled;
    private ArrayList<Double> voiceFingerprint;
    private String transferPin;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;

}
