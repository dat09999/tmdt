package com.example.backend.controller;

import com.example.backend.module.Notification;
import com.example.backend.module.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Page<Notification>> getMyNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String userId = currentUserId(authentication);
        return ResponseEntity.ok(notificationService.getByUser(userId, page, size));
    }

    // Click vào 1 thông báo -> lấy chi tiết, tự động mark as read luôn
    @GetMapping("/{id}")
    public ResponseEntity<Notification> getById(
            Authentication authentication, @PathVariable String id) {
        String userId = currentUserId(authentication);
        return ResponseEntity.ok(notificationService.getById(id, userId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication authentication) {
        String userId = currentUserId(authentication);
        return ResponseEntity.ok(Map.of("count", notificationService.countUnread(userId)));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(Authentication authentication, @PathVariable String id) {
        String userId = currentUserId(authentication);
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu đã đọc"));
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Authentication authentication) {
        String userId = currentUserId(authentication);
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu tất cả đã đọc"));
    }

    private String currentUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy user"));
        return user.getId();
    }
}