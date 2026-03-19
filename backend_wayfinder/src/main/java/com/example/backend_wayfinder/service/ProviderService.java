package com.example.backend_wayfinder.service;

import com.example.backend_wayfinder.Dto.ProviderDto;
import java.util.List;
import java.util.UUID;

public interface ProviderService {
    List<ProviderDto> getAllProviders();
    ProviderDto getProviderById(UUID providerId);
    ProviderDto findProviderByNameFuzzy(String name);
    ProviderDto findProviderByKeywordFuzzy(String keyword);
    List<ProviderDto> searchProvidersByName(String name);
}

