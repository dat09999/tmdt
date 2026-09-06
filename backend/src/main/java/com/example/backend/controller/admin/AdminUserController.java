package com.example.backend.controller.admin;

import com.example.backend.DTO.admin.UserStatusUpdateRequest;
import com.example.backend.DTO.user.UserResponse;
import com.example.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin - Users", description = "API quản trị người dùng toàn hệ thống")
@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;

    @Operation(summary = "Liệt kê danh sách người dùng toàn hệ thống có lọc và phân trang")
    @GetMapping
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String provider,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "id"));
        return ResponseEntity.ok(userService.getAllUsers(active, provider, keyword, pageable));
    }

    @Operation(summary = "Khóa hoặc mở khóa tài khoản người dùng (Vô hiệu hóa tức thì JWT)")
    @PatchMapping("/{userId}/status")
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable String userId,
            @Valid @RequestBody UserStatusUpdateRequest request) {
        return ResponseEntity.ok(userService.updateUserStatus(userId, request.getActive()));
    }
}
