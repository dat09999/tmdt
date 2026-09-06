package com.example.backend.controller.admin;

import com.example.backend.module.RefundRequest;
import com.example.backend.service.RefundRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin - Refunds", description = "API quản trị yêu cầu hoàn tiền/trả hàng toàn sàn")
@RestController
@RequestMapping("/admin/refunds")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminRefundController {

    private final RefundRequestService refundRequestService;

    @Operation(summary = "Xem danh sách yêu cầu hoàn tiền toàn sàn (ưu tiên lọc PENDING để xử lý)")
    @GetMapping
    public ResponseEntity<Page<RefundRequest>> getAllRefunds(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(refundRequestService.getAllRefundRequests(status, pageable));
    }
}
