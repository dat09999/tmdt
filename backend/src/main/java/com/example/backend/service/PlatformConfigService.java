package com.example.backend.service;

import com.example.backend.module.PlatformConfig;

public interface PlatformConfigService {

    /** Lấy cấu hình hệ thống hiện tại, khởi tạo mặc định 5% nếu chưa có */
    PlatformConfig getConfig();

    /** Cập nhật tỷ lệ hoa hồng sàn */
    PlatformConfig updateCommissionRate(Double newRate, String adminId);
}
