package com.example.backend.DTO.order;

import com.example.backend.module.Address;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreateOrderRequest {

    @NotBlank(message = "buyerId không được để trống")
    private String buyerId;

    @NotNull(message = "shippingAddress không được để trống")
    private Address shippingAddress;

    /**
     * Chỉ các dòng giỏ hàng người mua đã tick chọn.
     * Một dòng giỏ hiện được định danh bằng productId + variantSku.
     */
    @NotEmpty(message = "Phải chọn ít nhất một sản phẩm")
    @Valid
    private List<SelectedCartItem> selectedItems;

    private String couponCode;
    private String note;                // ghi chú của người mua

    @NotBlank(message = "paymentMethod không được để trống")
    private String paymentMethod;       // COD, VNPAY, MOMO, ZALOPAY

    @Getter
    @Setter
    public static class SelectedCartItem {
        @NotBlank(message = "productId không được để trống")
        private String productId;

        @NotBlank(message = "variantSku không được để trống")
        private String variantSku;

    }
}
