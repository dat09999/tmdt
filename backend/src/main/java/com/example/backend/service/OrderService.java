package com.example.backend.service;

import com.example.backend.DTO.order.BuyNowOrderRequest;
import com.example.backend.DTO.order.CreateOrderRequest;
import com.example.backend.module.Order;
import org.springframework.data.domain.Page;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface OrderService {
    List<Order> createOrderFromCart(CreateOrderRequest request);


    Order createOrderDirect(BuyNowOrderRequest request);

    List<Order> getOrdersByBuyer(String buyerId);
    Page<Order> getOrdersByBuyer(String buyerId, int page, int size);

    List<Order> getOrdersByShop(String shopId);
    Page<Order> getOrdersByShop(String shopId, int page, int size);
    Order getOrderById(String orderId);
    Order updateOrderStatus(String orderId, String status, String updatedBy, String note);
    Order startShipping(String orderId, String shippingProvider, String trackingCode, String note);
    Order markPaymentSuccess(String orderCode, String transactionCode);
    Order cancelOrder(String orderId, String canceledBy, String reason);
    // Thêm các dòng sau vào interface OrderService.java hiện có của bạn
// (bên cạnh createOrderFromCart, createOrderDirect, cancelOrder, markPaymentSuccess... đã có)

    // Tra order theo orderCode (vnp_TxnRef) - PaymentController cần dùng vì
// VNPay chỉ trả về orderCode, không biết Mongo _id của bạn.
    Order getOrderByCode(String orderCode);

    // Gọi khi IPN báo vnp_ResponseCode != "00" (thanh toán thất bại/hủy trên VNPay)
// -> hủy đơn + hoàn tồn kho ngay, không cần đợi job quét hết hạn.
    Order markPaymentFailed(String orderCode, String reason);

    // Gọi định kỳ (scheduled job) để hủy các đơn PENDING quá hạn chưa thanh toán,
// hoàn lại tồn kho đã giữ chỗ. Trả về số lượng đơn đã hủy (để log).
    int cancelExpiredPendingOrders(int minutesThreshold);

    // Admin lấy danh sách đơn hàng toàn hệ thống có lọc và phân trang
    org.springframework.data.domain.Page<Order> getAllOrders(
            String orderStatus,
            java.util.Date startDate,
            java.util.Date endDate,
            String shopId,
            String buyerId,
            org.springframework.data.domain.Pageable pageable
    );
}
