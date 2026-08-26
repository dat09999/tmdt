package com.example.backend.DTO.common;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ActionResponse {
    private boolean success;
    private String message;
}
