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

@Document(collection = "coupons")
@CompoundIndexes({
        @CompoundIndex(name = "coupon_shop_active_idx", def = "{'shopId': 1, 'active': 1}")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    private String id;

    private String shopId;          // null = coupon toàn hệ thống, có giá trị = coupon của shop
    private String scope;           // PLATFORM, SHOP

    @Indexed(unique = true)
    private String code;
    private String discountType;    // PERCENT, FIXED
    private Long discountValue;
    private Long minOrderValue;
    private Long maxDiscountAmount; // giới hạn số tiền giảm tối đa (dùng khi discountType=PERCENT)

    private List<String> applicableProductIds;  // null = áp dụng cho tất cả sản phẩm

    private Date startDate;
    private Date endDate;

    private Integer usageLimit;     // tổng số lần dùng
    private Integer usageLimitPerUser; // giới hạn mỗi user dùng tối đa bao nhiêu lần
    private Integer usedCount;

    private Boolean active;
    private Date createdAt;
}
