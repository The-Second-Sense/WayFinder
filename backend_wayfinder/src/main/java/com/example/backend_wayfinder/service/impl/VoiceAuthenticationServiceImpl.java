package com.example.backend_wayfinder.service.impl;

import com.example.backend_wayfinder.service.VoiceAuthenticationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
public class VoiceAuthenticationServiceImpl implements VoiceAuthenticationService {

    private static final double SIMILARITY_THRESHOLD = 0.85;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public boolean verifyVoice(List<Double> currentFingerprint, List<Double> referenceFingerprint) {
        if (currentFingerprint == null || referenceFingerprint == null) {
            log.warn("Voice verification failed: null fingerprint provided");
            return false;
        }

        if (currentFingerprint.size() != 512 || referenceFingerprint.size() != 512) {
            log.warn("Voice verification failed: invalid fingerprint size (expected 512, got current={}, reference={})",
                    currentFingerprint.size(), referenceFingerprint.size());
            return false;
        }

        double similarity = cosineSimilarity(currentFingerprint, referenceFingerprint);
        boolean isMatch = similarity > SIMILARITY_THRESHOLD;

        log.info("Voice verification: similarity={}, threshold={}, match={}",
                similarity, SIMILARITY_THRESHOLD, isMatch);

        return isMatch;
    }

    @Override
    public double getSimilarityScore(List<Double> currentFingerprint, List<Double> referenceFingerprint) {
        if (currentFingerprint == null || referenceFingerprint == null) {
            return 0.0;
        }

        if (currentFingerprint.size() != 512 || referenceFingerprint.size() != 512) {
            return 0.0;
        }

        return cosineSimilarity(currentFingerprint, referenceFingerprint);
    }

    @Override
    public boolean validatePin(com.example.backend_wayfinder.entities.UserEntity user, String pin) {
        if (user == null || user.getTransferPin() == null || pin == null) {
            return false;
        }
        // The PIN is not encoded in the database, so we do a plain text comparison for now.
        // In a real application, the PIN should be stored hashed.
        return user.getTransferPin().equals(pin);
    }

    /**
     * Calculate cosine similarity between two 512-dimensional vectors
     * Formula: (A · B) / (||A|| * ||B||)
     */
    private double cosineSimilarity(List<Double> a, List<Double> b) {
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < a.size(); i++) {
            dotProduct += a.get(i) * b.get(i);
            normA += Math.pow(a.get(i), 2);
            normB += Math.pow(b.get(i), 2);
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
