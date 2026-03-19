package com.example.backend_wayfinder.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "providers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false, unique = true, length = 20)  // Match database limit
    private String targetAccountNumber;

    @Column(nullable = false)
    private String keywords; // Comma-separated keywords for matching, e.g., "digi,rcs,rds"
}

