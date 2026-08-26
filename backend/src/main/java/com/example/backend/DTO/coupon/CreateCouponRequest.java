package com.example.backend.DTO.coupon;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;
import java.util.List;

@Getter
@Setter
public class CreateCouponRequest {

    private String shopId;              // null = coupon hệ thống
    private String scope;               // PLATFORM, SHOP

    @NotBlank(message = "code không được để trống")
    private String code;

    @NotBlank(message = "discountType không được để trống")
    private String discountType;        // PERCENT, FIXED

    @NotNull(message = "discountValue không được để trống")
    @Min(value = 0, message = "discountValue phải >= 0")
    private Long discountValue;

    @Min(value = 0, message = "minOrderValue phải >= 0")
    private Long minOrderValue;

    @Min(value = 0, message = "maxDiscountAmount phải >= 0")
    private Long maxDiscountAmount;     // giới hạn tiền giảm tối đa khi dùng PERCENT

    private List<String> applicableProductIds; // null = áp cho tất cả

    private Date startDate;
    private Date endDate;

    @Min(value = 1, message = "usageLimit phải >= 1")
    private Integer usageLimit;

    @Min(value = 1, message = "usageLimitPerUser phải >= 1")
    private Integer usageLimitPerUser;
}
