package com.example.backend_wayfinder.service;

import com.example.backend_wayfinder.Dto.CreateUserRequest;
import com.example.backend_wayfinder.Dto.UpdateUserRequest;
import com.example.backend_wayfinder.Dto.UserDto;
import com.example.backend_wayfinder.entities.UserEntity;
import com.example.backend_wayfinder.repository.UserRepository;
import com.example.backend_wayfinder.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    private UUID testUserId;
    private UserEntity testUser;
    private CreateUserRequest createRequest;
    private UpdateUserRequest updateRequest;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();

        testUser = UserEntity.builder()
                .userId(testUserId)
                .email("test@example.com")
                .passwordHash("hashedPassword123")
                .fullName("Test User")
                .phoneNumber("+40123456789")
                .isVoiceAuthEnabled(false)
                .voiceFingerprint(new ArrayList<>())
                .build();

        createRequest = CreateUserRequest.builder()
                .email("newuser@example.com")
                .password("Password123!")
                .fullName("New User")
                .phoneNumber("+40987654321")
                .build();

        updateRequest = UpdateUserRequest.builder()
                .fullName("Updated Name")
                .phoneNumber("+40111222333")
                .build();
    }

    @Test
    void testCreateUser_Success() {
        // Given
        when(userRepository.findByEmail(createRequest.getEmail())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(createRequest.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> {
            UserEntity user = invocation.getArgument(0);
            user.setUserId(UUID.randomUUID());
            return user;
        });

        // When
        UserDto result = userService.createUser(createRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo(createRequest.getEmail());
        assertThat(result.getFullName()).isEqualTo(createRequest.getFullName());
        verify(userRepository).save(any(UserEntity.class));
        verify(passwordEncoder).encode(createRequest.getPassword());
    }

    @Test
    void testCreateUser_EmailAlreadyExists_ThrowsException() {
        // Given
        when(userRepository.findByEmail(createRequest.getEmail())).thenReturn(Optional.of(testUser));

        // When/Then
        assertThatThrownBy(() -> userService.createUser(createRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already exists");

        verify(userRepository, never()).save(any());
    }

    @Test
    void testGetUserById_Success() {
        // Given
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        // When
        UserDto result = userService.getUserById(testUserId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getUserId()).isEqualTo(testUserId);
        assertThat(result.getEmail()).isEqualTo(testUser.getEmail());
        verify(userRepository).findById(testUserId);
    }

    @Test
    void testGetUserById_NotFound_ThrowsException() {
        // Given
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> userService.getUserById(testUserId))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void testUpdateUser_Success() {
        // Given
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(UserEntity.class))).thenReturn(testUser);

        // When
        UserDto result = userService.updateUserProfile(testUserId, updateRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(testUser.getFullName()).isEqualTo(updateRequest.getFullName());
        assertThat(testUser.getPhoneNumber()).isEqualTo(updateRequest.getPhoneNumber());
        verify(userRepository).save(testUser);
    }

    @Test
    void testEnableVoiceAuth_Success() {
        // Given
        byte[] voiceFingerprint = new byte[]{1, 2, 3, 4, 5};
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(UserEntity.class))).thenReturn(testUser);

        // When
        UserDto result = userService.enableVoiceAuth(testUserId, voiceFingerprint);

        // Then
        assertThat(result).isNotNull();
        assertThat(testUser.getIsVoiceAuthEnabled()).isTrue();
        assertThat(testUser.getVoiceFingerprint()).isNotNull();
        verify(userRepository).save(testUser);
    }

    @Test
    void testDisableVoiceAuth_Success() {
        // Given
        testUser.setIsVoiceAuthEnabled(true);
        testUser.setVoiceFingerprint(new ArrayList<>(Arrays.asList(0.1, 0.2)));
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(UserEntity.class))).thenReturn(testUser);

        // When
        UserDto result = userService.disableVoiceAuth(testUserId);

        // Then
        assertThat(result).isNotNull();
        assertThat(testUser.getIsVoiceAuthEnabled()).isFalse();
        assertThat(testUser.getVoiceFingerprint()).isNull();
        verify(userRepository).save(testUser);
    }


    @Test
    void testDeleteUser_Success() {
        // Given
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        doNothing().when(userRepository).delete(testUser);

        // When
        userService.deleteUser(testUserId);

        // Then
        verify(userRepository).delete(testUser);
    }

    @Test
    void testDeleteUser_NotFound_ThrowsException() {
        // Given
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> userService.deleteUser(testUserId))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");

        verify(userRepository, never()).delete(any());
    }
}

