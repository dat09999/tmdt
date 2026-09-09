package com.example.backend.controller;

import com.example.backend.DTO.shop.CreateShopCategoryRequest;
import com.example.backend.DTO.shop.ShopCategoryResponse;
import com.example.backend.service.ShopCategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Shop Categories", description = "API quản lý danh mục riêng của từng shop (Chủ shop tự tạo)")
@RestController
@RequestMapping("/shops/{shopId}/categories")
@RequiredArgsConstructor
public class ShopCategoryController {

    private final ShopCategoryService shopCategoryService;

    @Operation(summary = "Lấy danh sách các danh mục riêng của shop")
    @GetMapping
    public ResponseEntity<List<ShopCategoryResponse>> getShopCategories(
            @PathVariable String shopId,
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(shopCategoryService.getShopCategories(shopId, activeOnly));
    }

    @Operation(summary = "Lấy chi tiết một danh mục của shop")
    @GetMapping("/{categoryId}")
    public ResponseEntity<ShopCategoryResponse> getShopCategoryById(
            @PathVariable String shopId,
            @PathVariable String categoryId) {
        return ResponseEntity.ok(shopCategoryService.getShopCategoryById(shopId, categoryId));
    }

    @Operation(summary = "Chủ shop tạo mới một nhóm danh mục hàng riêng")
    @PostMapping
    public ResponseEntity<ShopCategoryResponse> createShopCategory(
            @PathVariable String shopId,
            @Valid @RequestBody CreateShopCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(shopCategoryService.createShopCategory(shopId, request));
    }

    @Operation(summary = "Chủ shop cập nhật danh mục của mình")
    @PutMapping("/{categoryId}")
    public ResponseEntity<ShopCategoryResponse> updateShopCategory(
            @PathVariable String shopId,
            @PathVariable String categoryId,
            @Valid @RequestBody CreateShopCategoryRequest request) {
        return ResponseEntity.ok(shopCategoryService.updateShopCategory(shopId, categoryId, request));
    }

    @Operation(summary = "Chủ shop xóa danh mục (tự động gỡ liên kết khỏi các sản phẩm)")
    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> deleteShopCategory(
            @PathVariable String shopId,
            @PathVariable String categoryId) {
        shopCategoryService.deleteShopCategory(shopId, categoryId);
        return ResponseEntity.noContent().build();
    }
}
