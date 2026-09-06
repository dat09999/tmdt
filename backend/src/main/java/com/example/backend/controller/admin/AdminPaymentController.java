package com.example.backend.controller.admin;

import com.example.backend.DTO.admin.PaymentReconciliationResponse;
import com.example.backend.module.Order;
import com.example.backend.module.Payment;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@Tag(name = "Admin - Payments", description = "API quản trị đối soát giao dịch thanh toán và phát hiện bất thường")
@RestController
@RequestMapping("/admin/payments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPaymentController {

    private final MongoTemplate mongoTemplate;

    @Operation(summary = "Xem lịch sử thanh toán toàn hệ thống, đối soát giao dịch và phát hiện đơn bất thường (PAID nhưng CANCELED)")
    @GetMapping
    public ResponseEntity<Page<PaymentReconciliationResponse>> getPayments(
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) Boolean anomalyOnly,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate,
            @RequestParam(required = false) String orderCode,
            @RequestParam(required = false) String transactionCode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Query query = new Query();
        query.addCriteria(Criteria.where("payment").exists(true).ne(null));

        if (paymentStatus != null && !paymentStatus.isBlank()) {
            query.addCriteria(Criteria.where("payment.status").is(paymentStatus.trim().toUpperCase()));
        }
        if (paymentMethod != null && !paymentMethod.isBlank()) {
            query.addCriteria(Criteria.where("payment.method").is(paymentMethod.trim().toUpperCase()));
        }
        if (orderCode != null && !orderCode.isBlank()) {
            query.addCriteria(Criteria.where("orderCode").is(orderCode.trim()));
        }
        if (transactionCode != null && !transactionCode.isBlank()) {
            query.addCriteria(Criteria.where("payment.transactionCode").is(transactionCode.trim()));
        }
        if (Boolean.TRUE.equals(anomalyOnly)) {
            query.addCriteria(Criteria.where("payment.status").is("PAID")
                    .and("orderStatus").is("CANCELED"));
        }
        if (startDate != null || endDate != null) {
            Criteria dateCriteria = Criteria.where("createdAt");
            if (startDate != null) dateCriteria = dateCriteria.gte(startDate);
            if (endDate != null) dateCriteria = dateCriteria.lte(endDate);
            query.addCriteria(dateCriteria);
        }

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "createdAt"));

        long total = mongoTemplate.count(query, Order.class);
        query.with(pageable);
        List<Order> orders = mongoTemplate.find(query, Order.class);

        List<PaymentReconciliationResponse> responses = orders.stream().map(o -> {
            Payment p = o.getPayment();
            String pStatus = p != null ? p.getStatus() : "UNKNOWN";
            boolean isAnomaly = "PAID".equalsIgnoreCase(pStatus) && "CANCELED".equalsIgnoreCase(o.getOrderStatus());
            String anomalyNote = isAnomaly
                    ? "BẤT THƯỜNG: Tiền đã trừ (PAID) nhưng đơn đã bị HỦY (CANCELED) - Cần hoàn tiền thủ công"
                    : null;

            return PaymentReconciliationResponse.builder()
                    .orderId(o.getId())
                    .orderCode(o.getOrderCode())
                    .buyerId(o.getBuyerId())
                    .shopId(o.getShopId())
                    .paymentMethod(p != null ? p.getMethod() : null)
                    .paymentStatus(pStatus)
                    .orderStatus(o.getOrderStatus())
                    .amount(p != null ? p.getAmount() : o.getTotalAmount())
                    .transactionCode(p != null ? p.getTransactionCode() : null)
                    .paidAt(p != null ? p.getPaidAt() : null)
                    .createdAt(o.getCreatedAt())
                    .isAnomaly(isAnomaly)
                    .anomalyNote(anomalyNote)
                    .build();
        }).toList();

        return ResponseEntity.ok(new PageImpl<>(responses, pageable, total));
    }
}
