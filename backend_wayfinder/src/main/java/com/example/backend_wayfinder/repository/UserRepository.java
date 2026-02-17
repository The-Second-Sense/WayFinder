package com.example.backend_wayfinder.repository;

import com.example.backend_wayfinder.entities.UserEntity;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;


@Repository
public interface UserRepository extends JpaRepository<UserEntity, UUID> {


    Optional<UserEntity> findByEmail(String email);

    boolean existsByEmail(String email);


    Optional<UserEntity> findByPhoneNumber(String phoneNumber);
}
