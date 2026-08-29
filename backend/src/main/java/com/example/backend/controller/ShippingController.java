package com.example.backend.controller;

import com.example.backend.DTO.order.ShippingEstimateRequest;
import com.example.backend.DTO.order.ShippingEstimateResponse;
import com.example.backend.service.ShippingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/shipping")
@RequiredArgsConstructor
public class ShippingController {

    private final ShippingService shippingService;

    @PostMapping("/estimate")
    public ResponseEntity<ShippingEstimateResponse> estimate(
            @Valid @RequestBody ShippingEstimateRequest request) {
        ShippingEstimateResponse response = shippingService.estimate(
                request.getShopId(),
                request.getBuyerLocation().getLat(),
                request.getBuyerLocation().getLng()
        );
        return ResponseEntity.ok(response);
    }
}