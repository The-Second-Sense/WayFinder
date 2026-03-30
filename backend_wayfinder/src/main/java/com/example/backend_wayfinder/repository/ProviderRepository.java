package com.example.backend_wayfinder.repository;

import com.example.backend_wayfinder.entities.ProviderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProviderRepository extends JpaRepository<ProviderEntity, UUID> {
    @Query("SELECT p FROM ProviderEntity p WHERE CONCAT(',', p.keywords, ',') LIKE CONCAT('%,', :keyword, ',%')")
    List<ProviderEntity> findByKeyword(@Param("keyword") String keyword);

    List<ProviderEntity> findByCategoryContainingIgnoreCase(String category);
}

