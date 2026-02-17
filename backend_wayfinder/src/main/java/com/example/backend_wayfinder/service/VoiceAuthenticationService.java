package com.example.backend_wayfinder.service;

import java.util.List;

public interface VoiceAuthenticationService {

    /**
     * Verify voice fingerprint against stored reference
     * @param currentFingerprint Voice fingerprint from current audio (512 dimensions)
     * @param referenceFingerprint Stored voice fingerprint from UserEntity.voiceFingerprint (512 dimensions)
     * @return true if voice matches (cosine similarity > threshold)
     */
    boolean verifyVoice(List<Double> currentFingerprint, List<Double> referenceFingerprint);

    /**
     * Get the similarity score (for debugging/logging)
     * @param currentFingerprint Current voice fingerprint
     * @param referenceFingerprint Reference voice fingerprint
     * @return Cosine similarity score between 0.0 and 1.0
     */
    double getSimilarityScore(List<Double> currentFingerprint, List<Double> referenceFingerprint);
}

