package com.example.backend_wayfinder.entities;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionEntity {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_account_id")
    private AccountEntity sourceAccount;

    @Column(name = "destination_account_number")
    private String destinationAccountNumber;

    @Column(precision = 15, scale = 2,nullable = false)
    private BigDecimal amount;

    @Column(length = 3, columnDefinition = "VARCHAR(3) DEFAULT 'RON'")
    private String currency;

    private String description;

    private String status;

    @Column(name = "initiated_by")
    private String initiatedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "linkedTransaction", cascade = CascadeType.ALL)
    private AiInteractionLogEntity interactionLog;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (currency == null || currency.isEmpty()) {
            currency = "RON";
        }
    }
}
