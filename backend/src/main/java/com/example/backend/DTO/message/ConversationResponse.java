package com.example.backend.DTO.message;

import lombok.Builder;
import lombok.Data;

import java.util.Date;

@Data @Builder
public class ConversationResponse {
    private String id;
    private String userId;
    private String shopId;
    private String shopName;
    private String lastMessage;
    private String lastMessageType;
    private Date lastMessageAt;
    private int unreadCountForUser;
    private int unreadCountForShop;
}