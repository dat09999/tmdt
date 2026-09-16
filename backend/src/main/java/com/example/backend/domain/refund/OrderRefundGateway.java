package com.example.backend.domain.refund;

import com.example.backend.module.Order;

import java.util.Optional;

public interface OrderRefundGateway {

    // Khóa order lại để tránh 2 request refund cùng lúc; trả về order nếu khóa thành công
    Optional<Order> lockForRefundRequest(String orderId);

    // Mở khóa lại nếu tạo refund thất bại giữa chừng, hoặc khi refund bị từ chối
    void unlockRefundFlag(String orderId);

    // Chuyển order sang REFUNDED, chỉ khi order còn đúng trạng thái cho phép
    Optional<Order> markRefunded(String orderId);

    // Giảm doanh số shop nếu order từng được tính vào doanh số
    void decrementShopSalesIfCounted(Order order);
}