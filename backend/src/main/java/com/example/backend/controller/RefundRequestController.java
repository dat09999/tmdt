package com.example.backend.controller;

import com.example.backend.DTO.refund.CreateRefundRequest;
import com.example.backend.module.RefundRequest;
import com.example.backend.service.RefundRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/refunds")
@RequiredArgsConstructor
public class RefundRequestController {

    private final RefundRequestService refundRequestService;

    @PostMapping
    public ResponseEntity<RefundRequest> createRefund(@Valid @RequestBody CreateRefundRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(refundRequestService.createRefundRequest(request));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<RefundRequest>> getByUser(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(refundRequestService.getRefundsByUser(userId, page, size));
    }

    @GetMapping("/shop/{shopId}")
    public ResponseEntity<Page<RefundRequest>> getByShop(
            @PathVariable String shopId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(refundRequestService.getRefundsByShop(shopId, page, size));
    }

    @GetMapping("/{refundId}")
    public ResponseEntity<RefundRequest> getById(@PathVariable String refundId) {
        return ResponseEntity.ok(refundRequestService.getRefundById(refundId));
    }

    @PatchMapping("/{refundId}/process")
    public ResponseEntity<RefundRequest> processRefund(@PathVariable String refundId,
                                                       @RequestParam String status,
                                                       @RequestParam(required = false) String adminNote,
                                                       @RequestParam String resolvedBy) {
        return ResponseEntity.ok(refundRequestService.processRefund(refundId, status, adminNote, resolvedBy));
    }
}
