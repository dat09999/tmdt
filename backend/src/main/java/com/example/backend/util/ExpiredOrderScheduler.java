//package com.example.backend.util;
//
//import com.example.backend.service.OrderService;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.scheduling.annotation.Scheduled;
//import org.springframework.stereotype.Component;
//
///**
// * Tự động hủy các đơn PENDING mà user bỏ ngang không thanh toán,
// * hoàn lại tồn kho đã bị "giam" lúc tạo đơn.
// *
// * Nhớ thêm @EnableScheduling vào class main (Application.java) hoặc 1 @Configuration
// * nếu chưa có, nếu không @Scheduled sẽ không chạy.
// */
//@Component
//@RequiredArgsConstructor
//@Slf4j
//public class ExpiredOrderScheduler {
//
//    private final OrderService orderService;
//
//    private static final int EXPIRE_MINUTES = 15; // phải khớp vnp_ExpireDate bên VNPayService
//
//    // Chạy mỗi 5 phút. Có thể chỉnh qua application.properties nếu muốn cấu hình linh hoạt.
//    @Scheduled(fixedDelay = 5 * 60 * 1000)
//    public void cancelExpiredOrders() {
//        try {
//            int canceled = orderService.cancelExpiredPendingOrders(EXPIRE_MINUTES);
//            if (canceled > 0) {
//                log.info("Đã tự động hủy {} đơn hàng quá hạn thanh toán", canceled);
//            }
//        } catch (Exception ex) {
//            // Không để job crash làm ảnh hưởng tới lần chạy tiếp theo
//            log.error("Lỗi khi chạy job hủy đơn hết hạn", ex);
//        }
//    }
//}