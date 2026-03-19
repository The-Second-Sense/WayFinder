package com.example.backend_wayfinder.controller;

import com.example.backend_wayfinder.Dto.ProviderDto;
import com.example.backend_wayfinder.service.ProviderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/providers")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ProviderController {

    private final ProviderService providerService;

    @GetMapping
    public ResponseEntity<List<ProviderDto>> getAllProviders() {
        log.info("Fetching all providers");
        List<ProviderDto> providers = providerService.getAllProviders();
        return ResponseEntity.ok(providers);
    }

    @GetMapping("/{providerId}")
    public ResponseEntity<ProviderDto> getProvider(@PathVariable UUID providerId) {
        log.info("Fetching provider {}", providerId);
        ProviderDto provider = providerService.getProviderById(providerId);
        return ResponseEntity.ok(provider);
    }

    @GetMapping("/search/by-name")
    public ResponseEntity<ProviderDto> findProviderByName(@RequestParam String name) {
        log.info("Finding provider by name: {}", name);
        ProviderDto provider = providerService.findProviderByNameFuzzy(name);
        return ResponseEntity.ok(provider);
    }

    @GetMapping("/search/multiple")
    public ResponseEntity<List<ProviderDto>> searchProviders(@RequestParam String name) {
        log.info("Searching for providers matching: {}", name);
        List<ProviderDto> providers = providerService.searchProvidersByName(name);
        return ResponseEntity.ok(providers);
    }
}

