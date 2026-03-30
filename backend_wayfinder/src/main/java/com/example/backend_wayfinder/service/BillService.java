package com.example.backend_wayfinder.service;

import com.example.backend_wayfinder.Dto.BillDto;
import com.example.backend_wayfinder.Dto.CreateBillRequest;

import java.util.List;
import java.util.UUID;

public interface BillService {
    BillDto createBill(CreateBillRequest request);
    BillDto getBillById(UUID billId);
    List<BillDto> getUserBills(UUID userId);
    List<BillDto> getUserPendingBills(UUID userId);
    List<BillDto> getUserBillsByProviderName(UUID userId, String providerName);
    List<BillDto> getUserBillsByCategory(UUID userId, String category);
    BillDto updateBillStatus(UUID billId, String status);
    void deleteBill(UUID billId);
}

