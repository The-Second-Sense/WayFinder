package com.example.backend_wayfinder.controller;

import com.example.backend_wayfinder.service.ModalAiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HealthCheckController {

    private final ModalAiService modalAiService;

    /**
     * Get health status of all AI services including circuit breaker states
     *
     * GET /api/health/ai-services
     *
     * Response:
     * {
     *   "overall_status": "HEALTHY" | "DEGRADED" | "DOWN",
     *   "services": {
     *     "SecurityAgent": {
     *       "isAvailable": true,
     *       "consecutiveFailures": 0,
     *       "lastFailure": null,
     *       "circuitResetInSeconds": null
     *     },
     *     "FineTunedIntentAgent": { ... },
     *     "DeBertaZeroShot": { ... }
     *   }
     * }
     */
    @GetMapping("/ai-services")
    public ResponseEntity<Map<String, Object>> getAiServicesHealth() {
        log.info("Health check requested for AI services");

        Map<String, Object> servicesStatus = modalAiService.getServicesHealthStatus();
        Map<String, Object> response = new HashMap<>();

        // Determine overall status
        String overallStatus = determineOverallStatus(servicesStatus);

        response.put("overall_status", overallStatus);
        response.put("services", servicesStatus);
        response.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.ok(response);
    }

    private String determineOverallStatus(Map<String, Object> servicesStatus) {
        if (servicesStatus.isEmpty()) {
            return "UNKNOWN";
        }

        int totalServices = servicesStatus.size();
        long healthyServices = servicesStatus.values().stream()
            .filter(service -> {
                if (service instanceof Map) {
                    Map<String, Object> serviceMap = (Map<String, Object>) service;
                    return Boolean.TRUE.equals(serviceMap.get("isAvailable"));
                }
                return false;
            })
            .count();

        if (healthyServices == totalServices) {
            return "HEALTHY";
        } else if (healthyServices > 0) {
            return "DEGRADED";
        } else {
            return "DOWN";
        }
    }
}

