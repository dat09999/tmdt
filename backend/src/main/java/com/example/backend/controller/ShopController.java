package com.example.backend.controller;

import com.example.backend.DTO.shop.*;
import com.example.backend.service.ShopService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/shops")
@RequiredArgsConstructor
@Slf4j
public class ShopController {

    private final ShopService shopService;

    @PostMapping
    public ResponseEntity<ShopResponse> createShop(@Valid @RequestBody CreateShopRequest request) {
        log.info("hello1");
        return ResponseEntity.status(HttpStatus.CREATED).body(shopService.createShop(request));
    }

    @GetMapping
    public ResponseEntity<Page<ShopSummaryResponse>> getAllShops(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        return ResponseEntity.ok(shopService.getShopsPaged(pageable));
    }

    @GetMapping("/{shopId}")
    public ResponseEntity<ShopResponse> getShopById(@PathVariable String shopId) {
        return ResponseEntity.ok(shopService.getShopById(shopId));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<ShopResponse> getShopByOwnerId(@PathVariable String ownerId) {
        return ResponseEntity.ok(shopService.getShopByOwnerId(ownerId));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ShopSummaryResponse>> searchByName(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        return ResponseEntity.ok(shopService.searchShopsPaged(keyword, pageable));
    }

    @GetMapping("/{shopId}/statistics")
    public ResponseEntity<ShopStatisticsResponse> statistics(@PathVariable String shopId) {
        return ResponseEntity.ok(shopService.getShopStatistics(shopId));
    }

    @GetMapping("/{shopId}/follow")
    public ResponseEntity<FollowShopResponse> followStatus(@PathVariable String shopId, @RequestParam String userId) {
        return ResponseEntity.ok(shopService.getFollowStatus(userId, shopId));
    }

    @PostMapping("/{shopId}/follow")
    public ResponseEntity<FollowShopResponse> follow(@PathVariable String shopId, @RequestParam String userId) {
        return ResponseEntity.ok(shopService.followShop(userId, shopId));
    }

    @DeleteMapping("/{shopId}/follow")
    public ResponseEntity<FollowShopResponse> unfollow(@PathVariable String shopId, @RequestParam String userId) {
        return ResponseEntity.ok(shopService.unfollowShop(userId, shopId));
    }

    @PutMapping("/{shopId}")
    public ResponseEntity<ShopResponse> updateShop(@PathVariable String shopId,
                                           @RequestBody CreateShopRequest request) {
        return ResponseEntity.ok(shopService.updateShop(shopId, request));
    }

    @PatchMapping("/{shopId}/status")
    public ResponseEntity<ShopResponse> updateStatus(@PathVariable String shopId,
                                             @RequestParam String status) {
        return ResponseEntity.ok(shopService.updateStatus(shopId, status));
    }
}
