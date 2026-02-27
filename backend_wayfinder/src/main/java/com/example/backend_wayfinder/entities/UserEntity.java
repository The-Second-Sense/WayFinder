package com.example.backend_wayfinder.entities;

import java.util.UUID;


import com.example.backend_wayfinder.config.VectorType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "users")

public class UserEntity {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(name = "id")
    private UUID userId;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "is_voice_auth_enabled")
    private Boolean isVoiceAuthEnabled;

    @Column(name = "voice_fingerprint", columnDefinition = "vector(512)")
    @Type(value = VectorType.class)
    private ArrayList<Double> voiceFingerprint;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<AccountEntity> accounts;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<BeneficiaryEntity> beneficiaries;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<AiInteractionLogEntity> interactionLogs;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }



}
