package com.example.backend.domain.refund;

import com.example.backend.module.Order;
import com.example.backend.module.OrderItem;
import com.example.backend.module.RefundRequest;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class ProcessRefundUseCaseTest {

    // ----- 3 class giả (fake), thay thế hoàn toàn cho MongoDB -----

    static class FakeRefundRequestGateway implements RefundRequestGateway {
        Map<String, RefundRequest> refunds = new HashMap<>();

        @Override
        public RefundRequest save(RefundRequest refund) {
            refunds.put(refund.getId(), refund);
            return refund;
        }

        @Override
        public Optional<RefundRequest> markProcessed(String refundId, String newStatus, String adminNote, String resolvedBy) {
            RefundRequest refund = refunds.get(refundId);
            if (refund == null || !"PENDING".equalsIgnoreCase(refund.getStatus())) {
                return Optional.empty(); // giả lập đúng hành vi findAndModify: không khớp điều kiện thì trả rỗng
            }
            refund.setStatus(newStatus);
            return Optional.of(refund);
        }
    }

    static class FakeOrderRefundGateway implements OrderRefundGateway {
        Map<String, Order> orders = new HashMap<>();
        boolean unlockCalled = false;
        boolean decrementCalled = false;

        @Override
        public Optional<Order> lockForRefundRequest(String orderId) {
            return Optional.ofNullable(orders.get(orderId));
        }

        @Override
        public void unlockRefundFlag(String orderId) {
            unlockCalled = true;
        }

        @Override
        public Optional<Order> markRefunded(String orderId) {
            Order order = orders.get(orderId);
            if (order == null) return Optional.empty();
            order.setOrderStatus("REFUNDED");
            return Optional.of(order);
        }

        @Override
        public void decrementShopSalesIfCounted(Order order) {
            decrementCalled = true;
        }
    }

    static class FakeStockGateway implements StockGateway {
        // ghi lại mọi lần restore để test kiểm tra sau
        List<String[]> restoredCalls = new java.util.ArrayList<>();

        @Override
        public void restore(String productId, String sku, int qty) {
            restoredCalls.add(new String[]{productId, sku, String.valueOf(qty)});
        }
    }

    // ----- Test case 1: duyệt refund thành công phải trả stock -----

    @Test
    void approveRefund_shouldRestoreStockAndDecrementSales() {
        // chuẩn bị dữ liệu giả
        FakeRefundRequestGateway refundGateway = new FakeRefundRequestGateway();
        FakeOrderRefundGateway orderGateway = new FakeOrderRefundGateway();
        FakeStockGateway stockGateway = new FakeStockGateway();

        RefundRequest refund = RefundRequest.builder()
                .id("refund-1")
                .orderId("order-1")
                .status("PENDING")
                .build();
        refundGateway.refunds.put("refund-1", refund);

        OrderItem item = new OrderItem();
        item.setProductId("product-1");
        item.setVariantSku("SKU-A");
        item.setQuantity(3);

        Order order = new Order();
        order.setId("order-1");
        order.setOrderStatus("COMPLETED");
        order.setItems(List.of(item));
        orderGateway.orders.put("order-1", order);

        ProcessRefundUseCase useCase = new ProcessRefundUseCase(refundGateway, orderGateway, stockGateway);

        // hành động thật sự đang test
        RefundRequest result = useCase.execute("refund-1", "APPROVED", "ok", "admin-1");

        // kiểm tra kết quả
        assertEquals("APPROVED", result.getStatus());
        assertEquals(1, stockGateway.restoredCalls.size());
        assertArrayEquals(new String[]{"product-1", "SKU-A", "3"}, stockGateway.restoredCalls.get(0));
        assertTrue(orderGateway.decrementCalled);
        assertEquals("REFUNDED", order.getOrderStatus());
    }

    // ----- Test case 2: xử lý refund đã xử lý rồi (không còn PENDING) phải báo lỗi -----

    @Test
    void processRefund_alreadyProcessed_shouldThrow() {
        FakeRefundRequestGateway refundGateway = new FakeRefundRequestGateway();
        FakeOrderRefundGateway orderGateway = new FakeOrderRefundGateway();
        FakeStockGateway stockGateway = new FakeStockGateway();

        RefundRequest refund = RefundRequest.builder()
                .id("refund-2")
                .orderId("order-2")
                .status("APPROVED") // đã xử lý rồi, không còn PENDING
                .build();
        refundGateway.refunds.put("refund-2", refund);

        ProcessRefundUseCase useCase = new ProcessRefundUseCase(refundGateway, orderGateway, stockGateway);

        assertThrows(RefundAlreadyProcessedException.class,
                () -> useCase.execute("refund-2", "APPROVED", "note", "admin-1"));
    }

    // ----- Test case 3: từ chối refund phải mở khóa lại order -----

    @Test
    void rejectRefund_shouldUnlockOrder() {
        FakeRefundRequestGateway refundGateway = new FakeRefundRequestGateway();
        FakeOrderRefundGateway orderGateway = new FakeOrderRefundGateway();
        FakeStockGateway stockGateway = new FakeStockGateway();

        RefundRequest refund = RefundRequest.builder()
                .id("refund-3")
                .orderId("order-3")
                .status("PENDING")
                .build();
        refundGateway.refunds.put("refund-3", refund);

        ProcessRefundUseCase useCase = new ProcessRefundUseCase(refundGateway, orderGateway, stockGateway);
        useCase.execute("refund-3", "REJECTED", "không hợp lệ", "admin-1");

        assertTrue(orderGateway.unlockCalled);
    }
}