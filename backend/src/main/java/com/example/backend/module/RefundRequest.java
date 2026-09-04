package com.example.backend.module;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;

@Document(collection = "refund_requests")
@CompoundIndexes({
        @CompoundIndex(name = "refund_user_created_idx", def = "{'userId': 1, 'createdAt': -1}"),
        @CompoundIndex(name = "refund_shop_created_idx", def = "{'shopId': 1, 'createdAt': -1}")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundRequest {

    @Id
    private String id;

    @Indexed
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
