package com.example.backend.controller.admin;

import com.example.backend.DTO.product.ProductResponse;
import com.example.backend.service.ProductService;
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

@Tag(name = "Admin - Products", description = "API quản trị và kiểm duyệt sản phẩm toàn hệ thống")
@RestController
@RequestMapping("/admin/products")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {

    private final ProductService productService;

    @Operation(summary = "Liệt kê sản phẩm toàn hệ thống có lọc theo từ khóa, trạng thái, shop, danh mục")
    @GetMapping
    public ResponseEntity<Page<ProductResponse>> getAllProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String shopId,
            @RequestParam(required = false) String categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(productService.getAllProductsForAdmin(keyword, status, shopId, categoryId, pageable));
    }

    @Operation(summary = "Xem chi tiết sản phẩm theo ID")
    @GetMapping("/{productId}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable String productId) {
        return ResponseEntity.ok(productService.getProductById(productId));
    }

    @Operation(summary = "Cập nhật trạng thái sản phẩm (ACTIVE, INACTIVE, BANNED, PENDING)")
    @PatchMapping("/{productId}/status")
    public ResponseEntity<ProductResponse> updateProductStatus(
            @PathVariable String productId,
            @RequestParam String status) {
        return ResponseEntity.ok(productService.updateProductStatus(productId, status));
    }

    @Operation(summary = "Phê duyệt sản phẩm (chuyển sang ACTIVE)")
    @PostMapping("/{productId}/approve")
    public ResponseEntity<ProductResponse> approveProduct(@PathVariable String productId) {
        return ResponseEntity.ok(productService.approveProduct(productId));
    }

    @Operation(summary = "Khóa / gỡ sản phẩm vi phạm chính sách kèm lý do")
    @PostMapping("/{productId}/ban")
    public ResponseEntity<ProductResponse> banProduct(
            @PathVariable String productId,
            @RequestParam(required = false, defaultValue = "Vi phạm chính sách sàn TMĐT") String reason) {
        return ResponseEntity.ok(productService.banProduct(productId, reason));
    }

    @Operation(summary = "Xóa / ẩn sản phẩm khỏi hệ thống")
    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> deleteProduct(@PathVariable String productId) {
        productService.deleteProduct(productId);
        return ResponseEntity.noContent().build();
    }
}