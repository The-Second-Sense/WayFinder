package com.example.backend_wayfinder.service;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.*;

public interface AuthenticationService {

    // Registration
    AuthenticationResponse register(CreateUserRequest request);

    // Login/Authentication
    AuthenticationResponse login(String phone, String password);
    AuthenticationResponse voiceLogin(byte[] voiceSample, String email);
    void logout(UUID userId);

    // Password Change (for authenticated users)
    boolean changePassword(UUID userId, String currentPassword, String newPassword);

    // Security validations
    boolean validateCredentials(String phone, String password);
    boolean validateVoiceAuthentication(byte[] voiceSample, UUID userId);

    // Session management
    void invalidateAllSessions(UUID userId);
    boolean isSessionValid(String sessionToken);


}
