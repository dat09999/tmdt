package com.example.backend.DTO.message;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
public class MessageRequest {
    @NotBlank
    private String conversationId;
    @NotBlank private String senderId;
    @NotBlank private String senderRole;   // "USER" | "SHOP"
    private String content;                // có thể null nếu chỉ gửi ảnh
    private List<MultipartFile> images;    // có thể null/empty
}