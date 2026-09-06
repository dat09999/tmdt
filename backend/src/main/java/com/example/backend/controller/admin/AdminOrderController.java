package com.example.backend.controller.admin;

import com.example.backend.module.Order;
import com.example.backend.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.Map;

@Tag(name = "Admin - Orders", description = "API quản trị đơn hàng toàn sàn và hủy đơn quá hạn")
@RestController
@RequestMapping("/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderService orderService;

    @Operation(summary = "Xem toàn bộ đơn hàng toàn sàn với bộ lọc trạng thái, ngày tháng, shopId, buyerId")
    @GetMapping
    public ResponseEntity<Page<Order>> getAllOrders(
            @RequestParam(required = false) String orderStatus,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date endDate,
            @RequestParam(required = false) String shopId,
            @RequestParam(required = false) String buyerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(orderService.getAllOrders(orderStatus, startDate, endDate, shopId, buyerId, pageable));
    }

    @Operation(summary = "Trigger thủ công hủy các đơn hàng PENDING quá hạn thanh toán và giải phóng tồn kho")
    @PostMapping("/cancel-expired")
    public ResponseEntity<Map<String, Object>> cancelExpiredOrders(
            @RequestParam(defaultValue = "15") int minutes) {
        int canceled = orderService.cancelExpiredPendingOrders(minutes);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "canceledCount", canceled,
                "message", "Đã hủy " + canceled + " đơn hàng PENDING quá hạn " + minutes + " phút và hoàn lại tồn kho"
        ));
    }
}
