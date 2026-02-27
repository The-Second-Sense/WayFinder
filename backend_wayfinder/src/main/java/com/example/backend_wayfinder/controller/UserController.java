package com.example.backend_wayfinder.controller;

import com.example.backend_wayfinder.Dto.UserDto;
import com.example.backend_wayfinder.entities.UserEntity;
import com.example.backend_wayfinder.repository.UserRepository;
import com.example.backend_wayfinder.service.JwtService;
import com.example.backend_wayfinder.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    /**
     * GET /api/user/profile
     * Returns the logged-in user's profile (name, email, phone, voice auth status).
     */
    @GetMapping("/profile")
    public ResponseEntity<UserDto> getProfile(@RequestHeader("Authorization") String authHeader) {
        UUID userId = getUserIdFromToken(authHeader);
        log.info("Fetching profile for user ID: {}", userId);
        UserDto user = userService.getUserById(userId);
        return ResponseEntity.ok(user);
    }

    // ── helper ───────────────────────────────────────────────────────────────

    private UUID getUserIdFromToken(String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtService.extractUsername(token);
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getUserId();
    }
}
