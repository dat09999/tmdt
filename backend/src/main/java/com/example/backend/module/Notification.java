package com.example.backend.module;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
@CompoundIndexes({
        // truy vấn phổ biến nhất: lấy thông báo của 1 user, mới nhất trước
        @CompoundIndex(name = "user_created_idx", def = "{'userId': 1, 'createdAt': -1}")
})
public class Notification {

    private String id;

    private String userId;

    private NotificationType type;

    private String title;
    private String message;

    // đường dẫn frontend điều hướng tới khi bấm vào thông báo,
    // ví dụ "/orders/abc123" hoặc "/product/xyz789"
    private String actionUrl;

    @Builder.Default
    private Boolean read = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum NotificationType {
        ORDER_STATUS,
        REVIEW_REPLY,
        CHAT_MESSAGE,
        PROMOTION,
        SYSTEM
    }
}