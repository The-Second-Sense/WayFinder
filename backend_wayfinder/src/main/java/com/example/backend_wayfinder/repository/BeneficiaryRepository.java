package com.example.backend_wayfinder.repository;

import java.util.UUID;

import com.example.backend_wayfinder.entities.BeneficiaryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface BeneficiaryRepository extends JpaRepository<BeneficiaryEntity,Integer> {

    List<BeneficiaryEntity> findByUser_UserId(UUID userId);

    Optional<BeneficiaryEntity> findByUser_UserIdAndNickname(UUID userId, String nickname);

    Optional<BeneficiaryEntity> findByUser_UserIdAndTargetAccountNumber(UUID userId, String targetAccountNumber);

    Optional<BeneficiaryEntity> findByUser_UserIdAndPhoneNumber(UUID userId, String phoneNumber);

    @Query("SELECT b FROM BeneficiaryEntity b WHERE b.user.userId = :userId " +
            "AND (LOWER(b.nickname) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(b.officialName) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<BeneficiaryEntity> searchBeneficiaries(@Param("userId") UUID userId,
                                          @Param("searchTerm") String searchTerm);

    boolean existsByUser_UserIdAndNickname(UUID userId, String nickname);

    boolean existsByUser_UserIdAndTargetAccountNumber(UUID userId, String targetAccountNumber);

    @Query("SELECT COUNT(b) FROM BeneficiaryEntity b WHERE b.user.userId = :userId")
    long countByUserId(@Param("userId") UUID userId);
}
