package com.example.backend.DTO.common;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddressRequest {

    @NotBlank(message = "Tên người nhận không được để trống")
    private String fullName;

    @NotBlank(message = "Số điện thoại địa chỉ không được để trống")
    @Pattern(
            regexp = "^(0|\\+84)[0-9]{9,10}$",
            message = "Số điện thoại địa chỉ không hợp lệ"
    )
    private String phone;

    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    private String province;

    @NotBlank(message = "Quận/Huyện không được để trống")
    private String district;

    @NotBlank(message = "Phường/Xã không được để trống")
    private String ward;

    @NotBlank(message = "Địa chỉ chi tiết không được để trống")
    private String detail;

    private Boolean isDefault;
}
