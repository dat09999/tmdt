package com.example.backend.service;

import com.example.backend.DTO.message.ConversationResponse;
import com.example.backend.DTO.message.MessageRequest;
import com.example.backend.DTO.message.MessageResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ChatService {

    /** Buyer bấm "Chat với shop" -> lấy conversation cũ hoặc tạo mới. userId lấy từ JWT. */
    ConversationResponse getOrCreateConversation(String shopId);

    /** Danh sách đoạn chat của chính buyer đang đăng nhập. */
    List<ConversationResponse> getConversationsByUser();

    /** Danh sách đoạn chat của 1 shop - chỉ chủ shop mới gọi được. */
    List<ConversationResponse> getConversationsByShop(String shopId);

    /** Gửi tin nhắn (text và/hoặc ảnh). Server tự xác định người gửi là buyer hay shop. */
    MessageResponse sendMessage(MessageRequest request);

    /** Lấy lịch sử tin nhắn, phân trang, mới nhất trước. */
    Page<MessageResponse> getMessages(String conversationId, int page, int size);

    /** Đánh dấu đã đọc toàn bộ tin nhắn phía người đang gọi API. */
    void markConversationAsRead(String conversationId);

    /** Tổng số đoạn chat có tin chưa đọc của buyer đang đăng nhập, để hiển thị badge. */
    long countUnreadConversations();

    /** Thu hồi tin nhắn - chỉ người gửi mới xóa được. */
    void deleteMessage(String messageId);
}