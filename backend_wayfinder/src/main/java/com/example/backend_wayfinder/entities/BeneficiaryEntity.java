package com.example.backend_wayfinder.entities;


import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Table(name = "beneficiaries", indexes = {
        @Index(name = "idx_user_nickname", columnList = "user_id,nickname")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BeneficiaryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "beneficiary_id")
    private Integer beneficiaryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(nullable = false)
    private String nickname;

    @Column(name = "official_name")
    private String officialName;

    @Column(name = "target_account_number", nullable = false)
    private String targetAccountNumber;

    @Column(name = "target_bank_code")
    private String targetBankCode;

    @Column(name = "phone_number")
    private String phoneNumber;
}
