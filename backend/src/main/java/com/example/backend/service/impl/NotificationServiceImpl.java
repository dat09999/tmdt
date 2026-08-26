package com.example.backend.service.impl;


import com.example.backend.Exception.ResourceNotFoundException;
import com.example.backend.module.Notification;
import com.example.backend.repository.NotificationRepository;
import com.example.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public Notification notify(String userId, Notification.NotificationType type,
                               String title, String message, String actionUrl) {
        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .actionUrl(actionUrl)
                .read(false)
                .build();

        notification = notificationRepository.save(notification);

        // Push realtime — bọc try-catch để lỗi WebSocket (session chết, broker
        // unreachable...) không làm rollback nghiệp vụ chính đang gọi notify().
        // Dữ liệu đã lưu DB ở trên rồi nên push fail cũng không mất thông báo,
        // user chỉ cần load lại trang /notifications là thấy.
        try {
            messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", notification);
        } catch (Exception e) {
            log.warn("Push WebSocket thất bại cho user {}: {}", userId, e.getMessage());
        }

        return notification;
    }

    @Override
    public Page<Notification> getByUser(String userId, int page, int size) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size));
    }

    @Override
    public Notification getById(String notificationId, String userId) {
        Notification n = findOwnedOrThrow(notificationId, userId);
        if (!n.getRead()) {
            n.setRead(true);
            n = notificationRepository.save(n);
        }
        return n;
    }

    @Override
    public long countUnread(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Override
    public void markAsRead(String notificationId, String userId) {
        Notification n = findOwnedOrThrow(notificationId, userId);
        if (!n.getRead()) {
            n.setRead(true);
            notificationRepository.save(n);
        }
    }

    @Override
    public void markAllAsRead(String userId) {
        // Cần NotificationRepository implement thêm NotificationRepositoryCustom
        // (dùng MongoTemplate.updateMulti) vì Spring Data MongoDB không hỗ trợ
        // bulk update qua derived method như JPA.
        notificationRepository.markAllAsReadByUserId(userId);
    }

    private Notification findOwnedOrThrow(String notificationId, String userId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo"));
        if (!n.getUserId().equals(userId)) {
            throw new AccessDeniedException("Thông báo không thuộc về bạn");
        }
        return n;
    }
}