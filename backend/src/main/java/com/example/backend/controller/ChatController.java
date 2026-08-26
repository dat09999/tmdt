package com.example.backend.controller;


import com.example.backend.DTO.message.ConversationResponse;
import com.example.backend.DTO.message.MessageRequest;
import com.example.backend.DTO.message.MessageResponse;
import com.example.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // Buyer bấm "Chat với shop" từ trang sản phẩm. userId lấy từ JWT bên trong service.
    @PostMapping("/conversations")
    public ResponseEntity<ConversationResponse> getOrCreateConversation(@RequestParam String shopId) {
        return ResponseEntity.ok(chatService.getOrCreateConversation(shopId));
    }

    // Danh sách đoạn chat của chính buyer đang đăng nhập.
    @GetMapping("/conversations/me")
    public ResponseEntity<List<ConversationResponse>> myConversations() {
        return ResponseEntity.ok(chatService.getConversationsByUser());
    }

    // Danh sách đoạn chat của 1 shop - service tự check requester có phải chủ shop không.
    @GetMapping("/conversations/shop/{shopId}")
    public ResponseEntity<List<ConversationResponse>> shopConversations(@PathVariable String shopId) {
        return ResponseEntity.ok(chatService.getConversationsByShop(shopId));
    }

    // multipart/form-data vì có thể kèm ảnh.
    @PostMapping(value = "/messages", consumes = "multipart/form-data")
    public ResponseEntity<MessageResponse> sendMessage(@ModelAttribute MessageRequest request) {
        return ResponseEntity.ok(chatService.sendMessage(request));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<Page<MessageResponse>> getMessages(
            @PathVariable String conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(chatService.getMessages(conversationId, page, size));
    }

    @PatchMapping("/conversations/{conversationId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable String conversationId) {
        chatService.markConversationAsRead(conversationId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> countUnread() {
        return ResponseEntity.ok(Map.of("count", chatService.countUnreadConversations()));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(@PathVariable String messageId) {
        chatService.deleteMessage(messageId);
        return ResponseEntity.noContent().build();
    }
}