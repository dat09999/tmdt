package com.example.backend.controller.admin;

import com.example.backend.DTO.shop.ShopResponse;
import com.example.backend.service.ShopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin - Shops", description = "API quản trị cửa hàng / gian hàng toàn hệ thống")
@RestController
@RequestMapping("/admin/shops")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminShopController {

    private final ShopService shopService;

    @Operation(summary = "Liệt kê danh sách gian hàng toàn hệ thống có lọc trạng thái, từ khóa và phân trang")
    @GetMapping
    public ResponseEntity<Page<ShopResponse>> getAllShops(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(shopService.getAllShopsForAdmin(status, keyword, pageable));
    }

    @Operation(summary = "Xem chi tiết thông tin gian hàng theo ID")
    @GetMapping("/{shopId}")
    public ResponseEntity<ShopResponse> getShopById(@PathVariable String shopId) {
        return ResponseEntity.ok(shopService.getShopById(shopId));
    }

    @Operation(summary = "Cập nhật trạng thái gian hàng (ACTIVE, PENDING, SUSPENDED, BANNED, INACTIVE)")
    @PatchMapping("/{shopId}/status")
    public ResponseEntity<ShopResponse> updateShopStatus(
            @PathVariable String shopId,
            @RequestParam String status) {
        return ResponseEntity.ok(shopService.updateStatus(shopId, status));
    }

    @Operation(summary = "Phê duyệt nhanh gian hàng chờ duyệt (chuyển sang ACTIVE)")
    @PostMapping("/{shopId}/approve")
    public ResponseEntity<ShopResponse> approveShop(@PathVariable String shopId) {
        return ResponseEntity.ok(shopService.approveShop(shopId));
    }

    @Operation(summary = "Đình chỉ / tạm khóa gian hàng vi phạm chính sách")
    @PostMapping("/{shopId}/suspend")
    public ResponseEntity<ShopResponse> suspendShop(
            @PathVariable String shopId,
            @RequestParam(required = false, defaultValue = "Vi phạm chính sách sàn") String reason) {
        return ResponseEntity.ok(shopService.banShop(shopId, reason));
    }
}
