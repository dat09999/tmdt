package com.example.backend.domain.refund;

import com.example.backend.module.Order;
import com.example.backend.module.OrderItem;
import com.example.backend.module.RefundRequest;

import java.util.Optional;

public class ProcessRefundUseCase {

    private final RefundRequestGateway refundGateway;
    private final OrderRefundGateway orderGateway;
    private final StockGateway stockGateway;

    public ProcessRefundUseCase(RefundRequestGateway refundGateway,
                                OrderRefundGateway orderGateway,
                                StockGateway stockGateway) {
        this.refundGateway = refundGateway;
        this.orderGateway = orderGateway;
        this.stockGateway = stockGateway;
    }

    public RefundRequest execute(String refundId, String status, String adminNote, String resolvedBy) {
        String newStatus = status.toUpperCase();

        RefundRequest refund = refundGateway.markProcessed(refundId, newStatus, adminNote, resolvedBy)
                .orElseThrow(() -> new RefundAlreadyProcessedException(refundId));

        if ("APPROVED".equalsIgnoreCase(newStatus)) {
            approve(refund);
        } else if ("REJECTED".equalsIgnoreCase(newStatus)) {
            orderGateway.unlockRefundFlag(refund.getOrderId());
        }

        return refund;
    }

    private void approve(RefundRequest refund) {
        Optional<Order> orderOpt = orderGateway.markRefunded(refund.getOrderId());

        if (orderOpt.isEmpty()) {
            throw new RefundOrderStateConflictException(refund.getOrderId(), refund.getId());
        }

        Order order = orderOpt.get();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                stockGateway.restore(item.getProductId(), item.getVariantSku(), item.getQuantity());
            }
        }
        orderGateway.decrementShopSalesIfCounted(order);
    }
}