package com.example.backend.util;

import com.example.backend.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Tự động hủy các đơn PENDING mà user bỏ ngang không thanh toán,
 * hoàn lại tồn kho đã bị "giam" lúc tạo đơn.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ExpiredOrderScheduler {

    private final OrderService orderService;
    private final MongoDistributedLock distributedLock;

    private static final int EXPIRE_MINUTES = 15; // phải khớp vnp_ExpireDate bên VNPayService
    private static final String LOCK_KEY = "lock_cancel_expired_orders";
    private static final long LOCK_DURATION_MS = 4 * 60 * 1000L; // 4 phút

    // Chạy mỗi 5 phút.
    @Scheduled(fixedDelay = 5 * 60 * 1000)
    public void cancelExpiredOrders() {
        if (!distributedLock.acquireLock(LOCK_KEY, LOCK_DURATION_MS)) {
            log.debug("Instance khác đang chạy job hủy đơn quá hạn, bỏ qua");
            return;
        }

        try {
            int canceled = orderService.cancelExpiredPendingOrders(EXPIRE_MINUTES);
            if (canceled > 0) {
                log.info("Đã tự động hủy {} đơn hàng quá hạn thanh toán", canceled);
            }
        } catch (Exception ex) {
            // Không để job crash làm ảnh hưởng tới lần chạy tiếp theo
            log.error("Lỗi khi chạy job hủy đơn hết hạn", ex);
        } finally {
            distributedLock.releaseLock(LOCK_KEY);
        }
    }
}