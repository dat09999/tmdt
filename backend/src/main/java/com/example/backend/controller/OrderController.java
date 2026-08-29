package com.example.backend.controller;

import com.example.backend.DTO.order.BuyNowOrderRequest;
import com.example.backend.DTO.order.CreateOrderRequest;
import com.example.backend.DTO.order.ShippingUpdateRequest;
import com.example.backend.module.Order;
import com.example.backend.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * Tạo một hoặc nhiều đơn từ các sản phẩm được chọn trong giỏ hàng.
     * POST /api/orders/from-cart
     */
    @PostMapping("/from-cart")
    public ResponseEntity<List<Order>> createOrderFromCart(
            @Valid @RequestBody CreateOrderRequest request) {

        List<Order> orders = orderService.createOrderFromCart(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(orders);
    }

    /**
     * Mua ngay một product variant, không đi qua giỏ hàng.
     * POST /api/orders/buy-now
     */
    @PostMapping("/buy-now")
    public ResponseEntity<Order> buyNow(
            @Valid @RequestBody BuyNowOrderRequest request) {

        Order order = orderService.createOrderDirect(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    /**
     * Lấy danh sách đơn hàng của người mua có phân trang.
     * GET /api/orders/buyer/{buyerId}
     */
    @GetMapping("/buyer/{buyerId}")
    public ResponseEntity<Page<Order>> getOrdersByBuyer(
            @PathVariable String buyerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(orderService.getOrdersByBuyer(buyerId, page, size));
    }

    /**
     * Lấy danh sách đơn hàng của shop có phân trang.
     * GET /api/orders/shop/{shopId}
     */
    @GetMapping("/shop/{shopId}")
    public ResponseEntity<Page<Order>> getOrdersByShop(
            @PathVariable String shopId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(orderService.getOrdersByShop(shopId, page, size));
    }

    /**
     * Xem chi tiết một đơn hàng.
     * GET /api/orders/{orderId}
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<Order> getOrderById(
            @PathVariable String orderId) {

        return ResponseEntity.ok(orderService.getOrderById(orderId));
    }

    /**
     * Shop/admin cập nhật trạng thái đơn hàng.
     * PATCH /api/orders/{orderId}/status
     */
    @PatchMapping("/{orderId}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable String orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request) {

        Order order = orderService.updateOrderStatus(
                orderId,
                request.status(),
                request.updatedBy(),
                request.note()
        );

        return ResponseEntity.ok(order);
    }

    @PatchMapping("/{orderId}/shipping")
    public ResponseEntity<Order> startShipping(
            @PathVariable String orderId,
            @Valid @RequestBody ShippingUpdateRequest request) {
        return ResponseEntity.ok(orderService.startShipping(
                orderId,
                request.shippingProvider(),
                request.trackingCode(),
                request.note()
        ));
    }

    /**
     * Người mua hoặc shop hủy đơn hàng.
     * PATCH /api/orders/{orderId}/cancel
     */
    @PatchMapping("/{orderId}/cancel")
    public ResponseEntity<Order> cancelOrder(
            @PathVariable String orderId,
            @Valid @RequestBody CancelOrderRequest request) {

        Order order = orderService.cancelOrder(
                orderId,
                request.canceledBy(),
                request.reason()
        );

        return ResponseEntity.ok(order);
    }

    /**
     * Callback nội bộ sau khi cổng thanh toán báo thành công.
     * Không nên cho frontend tự gọi API này khi triển khai thực tế.
     * PATCH /api/orders/payment/success
     */
    @PatchMapping("/payment/success")
    public ResponseEntity<Order> markPaymentSuccess(
            @Valid @RequestBody PaymentSuccessRequest request) {

        Order order = orderService.markPaymentSuccess(
                request.orderCode(),
                request.transactionCode()
        );

        return ResponseEntity.ok(order);
    }

    public record UpdateOrderStatusRequest(
            String status,
            String updatedBy,
            String note
    ) {
    }

    public record CancelOrderRequest(
            String canceledBy,
            String reason
    ) {
    }

    public record PaymentSuccessRequest(
            String orderCode,
            String transactionCode
    ) {
    }
}
