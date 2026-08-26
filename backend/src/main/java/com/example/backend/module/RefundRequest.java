package com.example.backend.module;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;

@Document(collection = "refund_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundRequest {

    @Id
    private String id;

    private String orderId;
    private String userId;
    private String shopId;

    private String reason;          // lý do hoàn trả
    private String type;            // REFUND (hoàn tiền), RETURN (trả hàng), EXCHANGE (đổi hàng)
    private String status;          // PENDING, APPROVED, REJECTED, COMPLETED

    private List<String> images;    // ảnh minh chứng

    private String adminNote;       // ghi chú của admin/shop khi xử lý
    private String resolvedBy;      // userId admin/seller xử lý

    private Long refundAmount;      // số tiền hoàn lại
    private Date resolvedAt;

    private Date createdAt;
    private Date updatedAt;
}
