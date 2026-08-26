package com.example.backend.service;

import com.example.backend.module.Notification;
import org.springframework.data.domain.Page;

public interface NotificationService {

    // Tạo + lưu DB + đẩy realtime qua WebSocket nếu user đang online.
    // Gọi hàm này từ chỗ sự kiện xảy ra, ví dụ OrderService khi đổi orderStatus,
    // hoặc ReviewService.replyToReview() khi shop phản hồi đánh giá.
    Notification notify(String userId, Notification.NotificationType type,
                        String title, String message, String actionUrl);

    Page<Notification> getByUser(String userId, int page, int size);

    // Xem chi tiết 1 thông báo — gọi khi user click vào item trong list.
    // Tự động đánh dấu đã đọc luôn nếu đang unread.
    Notification getById(String notificationId, String userId);

    long countUnread(String userId);

    void markAsRead(String notificationId, String userId);

    void markAllAsRead(String userId);
}