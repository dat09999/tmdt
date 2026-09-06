package com.example.backend.controller.admin;

import com.example.backend.DTO.admin.AdminBroadcastNotificationRequest;
import com.example.backend.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Admin - Notifications", description = "API phát sóng thông báo hệ thống diện rộng")
@RestController
@RequestMapping("/admin/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "Phát sóng thông báo tới toàn bộ người dùng hoặc danh sách user chỉ định")
    @PostMapping("/broadcast")
    public ResponseEntity<Map<String, Object>> broadcast(
            @Valid @RequestBody AdminBroadcastNotificationRequest request) {
        int sentCount = notificationService.broadcastNotification(request);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "sentCount", sentCount,
                "message", "Đã gửi thông báo thành công tới " + sentCount + " người dùng"
        ));
    }
}
