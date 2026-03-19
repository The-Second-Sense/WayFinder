package com.example.backend_wayfinder.repository;

import com.example.backend_wayfinder.entities.BillEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BillRepository extends JpaRepository<BillEntity, UUID> {
    List<BillEntity> findByUserIdAndStatus(UUID userId, String status);
    List<BillEntity> findByUserId(UUID userId);
    List<BillEntity> findByUserIdAndProviderId(UUID userId, UUID providerId);
    List<BillEntity> findByUserIdAndStatusAndProviderId(UUID userId, String status, UUID providerId);
}

