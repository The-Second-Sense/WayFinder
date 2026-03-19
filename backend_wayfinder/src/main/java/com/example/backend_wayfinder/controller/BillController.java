package com.example.backend_wayfinder.controller;

import com.example.backend_wayfinder.Dto.BillDto;
import com.example.backend_wayfinder.Dto.CreateBillRequest;
import com.example.backend_wayfinder.service.BillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class BillController {

    private final BillService billService;

    @PostMapping
    public ResponseEntity<BillDto> createBill(@Valid @RequestBody CreateBillRequest request) {
        log.info("Creating bill for user {}: {}", request.getUserId(), request.getBillName());
        BillDto bill = billService.createBill(request);
        return ResponseEntity.ok(bill);
    }

    @GetMapping("/{billId}")
    public ResponseEntity<BillDto> getBill(@PathVariable UUID billId) {
        log.info("Fetching bill {}", billId);
        BillDto bill = billService.getBillById(billId);
        return ResponseEntity.ok(bill);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BillDto>> getUserBills(@PathVariable UUID userId) {
        log.info("Fetching all bills for user {}", userId);
        List<BillDto> bills = billService.getUserBills(userId);
        return ResponseEntity.ok(bills);
    }

    @GetMapping("/user/{userId}/pending")
    public ResponseEntity<List<BillDto>> getUserPendingBills(@PathVariable UUID userId) {
        log.info("Fetching pending bills for user {}", userId);
        List<BillDto> bills = billService.getUserPendingBills(userId);
        return ResponseEntity.ok(bills);
    }

    @GetMapping("/user/{userId}/provider")
    public ResponseEntity<List<BillDto>> getUserBillsByProvider(
            @PathVariable UUID userId,
            @RequestParam String name) {
        log.info("Fetching bills for user {} with provider: {}", userId, name);
        List<BillDto> bills = billService.getUserBillsByProviderName(userId, name);
        return ResponseEntity.ok(bills);
    }

    @GetMapping("/user/{userId}/category")
    public ResponseEntity<List<BillDto>> getUserBillsByCategory(
            @PathVariable UUID userId,
            @RequestParam String category) {
        log.info("Fetching bills for user {} with category: {}", userId, category);
        List<BillDto> bills = billService.getUserBillsByCategory(userId, category);
        return ResponseEntity.ok(bills);
    }

    @PatchMapping("/{billId}/status")
    public ResponseEntity<BillDto> updateBillStatus(
            @PathVariable UUID billId,
            @RequestParam String status) {
        log.info("Updating bill {} status to {}", billId, status);
        BillDto bill = billService.updateBillStatus(billId, status);
        return ResponseEntity.ok(bill);
    }

    @DeleteMapping("/{billId}")
    public ResponseEntity<Void> deleteBill(@PathVariable UUID billId) {
        log.info("Deleting bill {}", billId);
        billService.deleteBill(billId);
        return ResponseEntity.noContent().build();
    }
}

