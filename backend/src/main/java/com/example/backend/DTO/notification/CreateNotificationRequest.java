package com.example.backend.DTO.notification;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateNotificationRequest {

    @NotBlank(message = "userId không được để trống")
    private String userId;

    @NotBlank(message = "title không được để trống")
    private String title;

    @NotBlank(message = "message không được để trống")
    private String message;

    private String type;            // ORDER, PROMOTION, REVIEW, SYSTEM, REFUND
    private String referenceId;
    private String referenceType;
}
