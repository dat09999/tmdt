package com.example.backend.DTO.refund;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreateRefundRequest {

    @NotBlank(message = "orderId không được để trống")
    private String orderId;

    @NotBlank(message = "userId không được để trống")
    private String userId;

    @NotBlank(message = "reason không được để trống")
    private String reason;

    private String type;            // REFUND, RETURN, EXCHANGE
    private List<String> images;
}
