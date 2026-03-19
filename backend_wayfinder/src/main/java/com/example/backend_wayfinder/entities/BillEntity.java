package com.example.backend_wayfinder.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bills")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private UUID providerId; // Foreign key to ProviderEntity

    @Column(nullable = false)
    private String billName; // e.g., "Digi Internet", "Enel Electricity"

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String currency; // RON, EUR, etc.

    @Column(nullable = false)
    private LocalDate dueDate; // When the bill is due

    @Column(nullable = false)
    private String status; // PENDING, PAID, OVERDUE

    @Column(nullable = true)
    private String accountNumber; // Customer account number with provider

    @Column(nullable = true)
    private String description; // Additional notes

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

