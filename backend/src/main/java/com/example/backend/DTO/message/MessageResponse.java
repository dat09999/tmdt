package com.example.backend.DTO.message;

import lombok.Builder;
import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
@Builder
public class MessageResponse {
    private String id;
    private String conversationId;
    private String senderId;
    private String senderRole;
    private String content;
    private List<String> imageUrls;   // đã resolve public/signed URL, không trả key thô
    private boolean isRead;
    private Date sentAt;
}