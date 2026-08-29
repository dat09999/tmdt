package com.example.backend.module;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "reviews")
@CompoundIndexes({
        // 1 user chỉ được đánh giá 1 lần cho đúng 1 sản phẩm trong đúng 1 đơn hàng
        @CompoundIndex(name = "unique_review_per_order_item",
                def = "{'orderId': 1, 'productId': 1, 'userId': 1}",
                unique = true),
        // truy vấn nhanh: lấy review theo sản phẩm, sort theo thời gian mới nhất
        @CompoundIndex(name = "product_created_idx",
                def = "{'productId': 1, 'createdAt': -1}")
})
public class Review {
@Id
    private String id;

    private String productId;
    private String orderId;       // để xác minh đã mua hàng mới được đánh giá ("verified purchase")
    private String variantSku;    // review theo đúng biến thể đã mua (màu/size...), có thể null

    private String userId;
    private String userName;      // lưu snapshot tên lúc đánh giá, tránh phải join sang User mỗi lần hiển thị
    private String userAvatarUrl;

    private Integer rating;       // 1-5 sao, bắt buộc
    private String comment;       // nội dung bình luận, có thể rỗng nếu chỉ chấm sao
    private List<String> imageUrls;

    private List<String> videoUrls;   // ảnh review (MinIO), optional

    private ReviewReply shopReply;    // shop phản hồi lại review, optional

    @Builder.Default
    private Integer helpfulCount = 0; // số người bấm "hữu ích"

    @Builder.Default
    private Boolean visible = true;   // để ẩn review vi phạm mà không cần xoá hẳn

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewReply {
        private String content;
        private LocalDateTime repliedAt;
    }
}