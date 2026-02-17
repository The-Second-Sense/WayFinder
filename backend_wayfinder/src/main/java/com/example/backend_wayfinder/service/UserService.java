package com.example.backend_wayfinder.service;

import java.util.UUID;

import com.example.backend_wayfinder.Dto.CreateUserRequest;
import com.example.backend_wayfinder.Dto.UpdateUserRequest;
import com.example.backend_wayfinder.Dto.UserDto;

public interface UserService {


    UserDto createUser(CreateUserRequest request);
    UserDto getUserById(UUID userId);
    UserDto getUserByEmail(String email);
    UserDto updateUserProfile(UUID userId, UpdateUserRequest request);
    void deleteUser(UUID userId);


    UserDto enableVoiceAuth(UUID userId, byte[] voiceFingerprint);
    UserDto disableVoiceAuth(UUID userId);


}
