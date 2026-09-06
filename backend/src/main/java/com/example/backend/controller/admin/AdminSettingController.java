package com.example.backend.controller.admin;

import com.example.backend.module.PlatformConfig;
import com.example.backend.sercurity.SecurityUtils;
import com.example.backend.service.PlatformConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin - Settings", description = "API quản trị cài đặt & cấu hình sàn (Tỷ lệ chiết khấu hoa hồng)")
@RestController
@RequestMapping("/admin/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSettingController {

    private final PlatformConfigService platformConfigService;

    @Operation(summary = "Lấy thông tin cấu hình tỷ lệ hoa hồng sàn hiện tại")
    @GetMapping("/commission")
    public ResponseEntity<PlatformConfig> getCommissionConfig() {
        return ResponseEntity.ok(platformConfigService.getConfig());
    }

    @Operation(summary = "Cập nhật tỷ lệ hoa hồng chiết khấu của sàn (%)")
    @PutMapping("/commission")
    public ResponseEntity<PlatformConfig> updateCommissionConfig(
            @RequestParam Double rate) {
        String adminId = "ADMIN";
        try {
            String current = SecurityUtils.getCurrentUserId();
            if (current != null && !current.isBlank()) {
                adminId = current;
            }
        } catch (Exception ignored) {
        }
        return ResponseEntity.ok(platformConfigService.updateCommissionRate(rate, adminId));
    }
}
