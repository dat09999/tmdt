package com.example.backend.controller;

import com.example.backend.module.Order;
import com.example.backend.service.OrderService;
import com.example.backend.service.impl.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment/vnpay")
@Slf4j
@RequiredArgsConstructor
public class PaymentController {

    private final VNPayService vnPayService;
    private final OrderService orderService;

    /**
     * Frontend gọi API này sau khi tạo order thành công để lấy URL redirect user sang VNPay.
     * Trả về orderId (không phải orderCode) vì đây là API nội bộ cho FE gọi.
     */
    @PostMapping("/create/{orderId}")
    public ResponseEntity<Map<String, String>> createPaymentUrl(@PathVariable String orderId,
                                                                HttpServletRequest request) {
        Order order = orderService.getOrderById(orderId);
        log.info(order.getOrderStatus());
        if (!"PENDING".equalsIgnoreCase(order.getOrderStatus())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Đơn hàng không ở trạng thái chờ thanh toán"));
        }


        String paymentUrl = vnPayService.createPaymentUrl(
                order.getOrderCode(),
                order.getTotalAmount(),
                "Thanh toan don hang " + order.getOrderCode(), // VNPay sandbox không nhận dấu tiếng Việt trong orderInfo
                request
        );

        return ResponseEntity.ok(Map.of("paymentUrl", paymentUrl));
    }

    /**
     * IPN (Instant Payment Notification) - VNPay gọi server-to-server, KHÔNG qua trình duyệt user.
     * Đây là nơi DUY NHẤT được phép xác nhận đơn hàng đã thanh toán thành công.
     * Response PHẢI đúng format JSON {"RspCode":"...","Message":"..."} theo tài liệu VNPay,
     * nếu không VNPay sẽ coi là lỗi và tự động gọi lại nhiều lần.
     */
    @GetMapping("/ipn")
    public ResponseEntity<Map<String, String>> ipnCallback(@RequestParam Map<String, String> allParams) {
        // Log toàn bộ params VNPay gửi lên - dùng để đối chiếu với "DS GD đã test" bên sandbox,
        // và để xác nhận IPN có thực sự tới được server hay không (xem qua Railway > Deployments > Logs).
        log.info("VNPay IPN nhận được: {}", allParams);

        Map<String, String> response = new HashMap<>();

        // 1. Verify chữ ký trước tiên - không tin bất kỳ field nào khi chưa verify
        if (!vnPayService.verifySignature(allParams)) {
            log.warn("VNPay IPN chữ ký không hợp lệ, orderCode={}", allParams.get("vnp_TxnRef"));
            response.put("RspCode", "97");
            response.put("Message", "Invalid signature");
            return ResponseEntity.ok(response);
        }

        String orderCode = allParams.get("vnp_TxnRef");
        String responseCode = allParams.get("vnp_ResponseCode");
        String vnpAmount = allParams.get("vnp_Amount");
        String transactionNo = allParams.get("vnp_TransactionNo");

        Order order;
        try {
            order = orderService.getOrderByCode(orderCode);
        } catch (RuntimeException ex) {
            log.warn("VNPay IPN không tìm thấy order, orderCode={}", orderCode);
            response.put("RspCode", "01");
            response.put("Message", "Order not found");
            return ResponseEntity.ok(response);
        }

        // 2. Idempotent - VNPay có thể gọi IPN nhiều lần cho cùng 1 giao dịch.
        // Trả RspCode "00" (thành công) chứ không phải mã lỗi khác - vì bản chất giao dịch
        // ĐÃ được xử lý đúng rồi, chỉ là gọi trùng. Nếu trả mã khác "00", VNPay sẽ hiểu là
        // request thất bại và tiếp tục gọi lại IPN nhiều lần nữa không cần thiết.
        if (order.getPayment() != null && "PAID".equalsIgnoreCase(order.getPayment().getStatus())) {
            log.info("VNPay IPN đã xử lý trước đó (trùng lặp), orderCode={}", orderCode);
            response.put("RspCode", "00");
            response.put("Message", "Order already confirmed");
            return ResponseEntity.ok(response);
        }

        // 3. So khớp số tiền - vnp_Amount đã nhân 100, phải chia lại trước khi so sánh
        long expectedAmount = order.getTotalAmount() * 100;
        if (vnpAmount == null || Long.parseLong(vnpAmount) != expectedAmount) {
            log.warn("VNPay IPN sai số tiền, orderCode={}, expected={}, got={}", orderCode, expectedAmount, vnpAmount);
            response.put("RspCode", "04");
            response.put("Message", "Invalid amount");
            return ResponseEntity.ok(response);
        }

        // 4. Xử lý theo kết quả thanh toán
        try {
            if ("00".equals(responseCode)) {
                orderService.markPaymentSuccess(orderCode, transactionNo);
                log.info("VNPay IPN xác nhận thanh toán thành công, orderCode={}, transactionNo={}", orderCode, transactionNo);
            } else {
                orderService.markPaymentFailed(orderCode, "VNPay báo lỗi, mã: " + responseCode);
                log.info("VNPay IPN báo thanh toán thất bại, orderCode={}, responseCode={}", orderCode, responseCode);
            }
            response.put("RspCode", "00");
            response.put("Message", "Confirm Success");
        } catch (RuntimeException ex) {
            log.error("Lỗi xử lý VNPay IPN, orderCode={}", orderCode, ex);
            response.put("RspCode", "99");
            response.put("Message", "Unknown error");
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Return URL - user bị redirect về đây sau khi thanh toán trên VNPay.
     * CHỈ dùng để hiển thị UI (thành công/thất bại/đang xử lý), KHÔNG dùng để cập nhật order.
     * Trạng thái đơn hàng thật sự lấy từ DB - do /ipn cập nhật độc lập, server-to-server.
     * IPN có thể đến SAU khi user đã được redirect về đây (độ trễ mạng), nên nếu VNPay báo
     * thành công nhưng DB chưa kịp cập nhật, trả "pendingConfirmation" để FE tự poll lại
     * thay vì kết luận thất bại ngay.
     */
    @GetMapping("/return")
    public ResponseEntity<Map<String, Object>> returnFromVnpay(
            @RequestParam Map<String, String> allParams) {

        Map<String, Object> result = new HashMap<>();

        boolean validSignature = vnPayService.verifySignature(allParams);
        String orderCode = allParams.get("vnp_TxnRef");
        String responseCode = allParams.get("vnp_ResponseCode");

        result.put("orderCode", orderCode);
        result.put("validSignature", validSignature);

        if (!validSignature) {
            result.put("message", "Chữ ký VNPay không hợp lệ");
            return ResponseEntity.badRequest().body(result);
        }

        if (orderCode == null || orderCode.isBlank()) {
            result.put("message", "Thiếu mã giao dịch vnp_TxnRef");
            return ResponseEntity.badRequest().body(result);
        }

        try {
            // Chỉ đọc trạng thái hiện tại từ DB - không gọi markPaymentSuccess/markPaymentFailed
            // ở đây. Trạng thái thật đã (hoặc sắp) được /ipn cập nhật độc lập.
            Order order = orderService.getOrderByCode(orderCode);
            String orderStatus = order.getOrderStatus();
            String paymentStatus = order.getPayment() != null ? order.getPayment().getStatus() : "UNPAID";

            boolean vnpaySaysSuccess = "00".equals(responseCode);
            boolean alreadyConfirmedPaid = "PAID".equalsIgnoreCase(paymentStatus);

            result.put("orderStatus", orderStatus);
            result.put("paymentStatus", paymentStatus);

            if (alreadyConfirmedPaid) {
                result.put("message", "Thanh toán thành công");
                result.put("paymentSuccessful", true);
            } else if (vnpaySaysSuccess) {
                // VNPay báo thành công nhưng IPN có thể chưa kịp xử lý xong.
                // FE nên poll lại API lấy trạng thái đơn hàng vài lần trước khi báo lỗi.
                result.put("message", "Đang xác nhận thanh toán, vui lòng đợi trong giây lát");
                result.put("paymentSuccessful", false);
                result.put("pendingConfirmation", true);
            } else {
                result.put("message", "Thanh toán không thành công");
                result.put("paymentSuccessful", false);
            }

            return ResponseEntity.ok(result);

        } catch (RuntimeException exception) {
            result.put("orderStatus", "UNKNOWN");
            result.put("message", exception.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }

    @GetMapping("/test")
    public ResponseEntity<?> testVNPay(
            HttpServletRequest request
    ) {

        String paymentUrl =
                vnPayService.createTestPaymentUrl(request);

        return ResponseEntity.ok(
                Map.of(
                        "paymentUrl",
                        paymentUrl
                )
        );
    }
}