package com.example.backend_wayfinder.service.impl;

import com.example.backend_wayfinder.Dto.BillDto;
import com.example.backend_wayfinder.Dto.CreateBillRequest;
import com.example.backend_wayfinder.entities.BillEntity;
import com.example.backend_wayfinder.entities.ProviderEntity;
import com.example.backend_wayfinder.repository.BillRepository;
import com.example.backend_wayfinder.repository.ProviderRepository;
import com.example.backend_wayfinder.service.BillService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class BillServiceImpl implements BillService {

    private final BillRepository billRepository;
    private final ProviderRepository providerRepository;

    @Override
    public BillDto createBill(CreateBillRequest request) {
        BillEntity bill = BillEntity.builder()
                .userId(request.getUserId())
                .providerId(request.getProviderId())
                .billName(request.getBillName())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .dueDate(request.getDueDate())
                .accountNumber(request.getAccountNumber())
                .description(request.getDescription())
                .status("PENDING")
                .build();

        BillEntity saved = billRepository.save(bill);
        log.info("Bill created for user {}: {} - {}", request.getUserId(), request.getBillName(), saved.getId());
        return mapToDto(saved);
    }

    @Override
    public BillDto getBillById(UUID billId) {
        BillEntity bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found with ID: " + billId));
        return mapToDto(bill);
    }

    @Override
    public List<BillDto> getUserBills(UUID userId) {
        List<BillEntity> bills = billRepository.findByUserId(userId);
        log.info("Retrieved {} bills for user {}", bills.size(), userId);
        return bills.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public List<BillDto> getUserPendingBills(UUID userId) {
        List<BillEntity> bills = billRepository.findByUserIdAndStatus(userId, "PENDING");
        log.info("Retrieved {} pending bills for user {}", bills.size(), userId);
        return bills.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    public List<BillDto> getUserBillsByProviderName(UUID userId, String providerName) {
        // Find provider by name (fuzzy match)
        List<ProviderEntity> providers = providerRepository.findAll().stream()
                .filter(p -> p.getName().toLowerCase().contains(providerName.toLowerCase()) ||
                             p.getKeywords().toLowerCase().contains(providerName.toLowerCase()))
                .collect(Collectors.toList());

        if (providers.isEmpty()) {
            log.info("No providers found matching: {}", providerName);
            return List.of();
        }

        // Get bills for these providers (only PENDING status)
        List<BillDto> bills = new java.util.ArrayList<>();
        for (ProviderEntity provider : providers) {
            List<BillEntity> providerBills = billRepository.findByUserIdAndStatusAndProviderId(userId, "PENDING", provider.getId());
            bills.addAll(providerBills.stream().map(this::mapToDto).collect(Collectors.toList()));
        }

        log.info("Retrieved {} bills for user {} with provider name containing: {}", bills.size(), userId, providerName);
        return bills;
    }

    @Override
    public List<BillDto> getUserBillsByCategory(UUID userId, String category) {
        // Find all providers with this category
        List<ProviderEntity> providers = providerRepository.findAll().stream()
                .filter(p -> p.getCategory().toLowerCase().contains(category.toLowerCase()))
                .collect(Collectors.toList());

        if (providers.isEmpty()) {
            log.info("No providers found with category: {}", category);
            return List.of();
        }

        // Get bills for these providers (only PENDING status)
        List<BillDto> bills = new java.util.ArrayList<>();
        for (ProviderEntity provider : providers) {
            List<BillEntity> categoryBills = billRepository.findByUserIdAndStatusAndProviderId(userId, "PENDING", provider.getId());
            bills.addAll(categoryBills.stream().map(this::mapToDto).collect(Collectors.toList()));
        }

        log.info("Retrieved {} bills for user {} with category: {}", bills.size(), userId, category);
        return bills;
    }

    @Override
    public BillDto updateBillStatus(UUID billId, String status) {
        BillEntity bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found with ID: " + billId));
        bill.setStatus(status);
        BillEntity updated = billRepository.save(bill);
        log.info("Bill {} status updated to {}", billId, status);
        return mapToDto(updated);
    }

    @Override
    public void deleteBill(UUID billId) {
        billRepository.deleteById(billId);
        log.info("Bill {} deleted", billId);
    }

    private BillDto mapToDto(BillEntity entity) {
        BillDto.BillDtoBuilder dtoBuilder = BillDto.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .providerId(entity.getProviderId())
                .billName(entity.getBillName())
                .amount(entity.getAmount())
                .currency(entity.getCurrency())
                .dueDate(entity.getDueDate())
                .status(entity.getStatus())
                .accountNumber(entity.getAccountNumber())
                .description(entity.getDescription());

        // Fetch provider details for convenience
        try {
            ProviderEntity provider = providerRepository.findById(entity.getProviderId()).orElse(null);
            if (provider != null) {
                dtoBuilder.providerName(provider.getName())
                        .providerCategory(provider.getCategory());
            }
        } catch (Exception e) {
            log.warn("Could not fetch provider details for bill {}", entity.getId());
        }

        return dtoBuilder.build();
    }
}

