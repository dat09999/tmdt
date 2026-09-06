package com.example.backend.DTO.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminOverviewResponse {
    /** Tổng giá trị giao dịch hàng hóa toàn sàn (GMV) */
    private long totalRevenue;

    /** Tỷ lệ phần trăm hoa hồng sàn thu (%) */
    private double commissionRate;

    /** Doanh thu thực sàn thu được từ hoa hồng (Net Platform Revenue) */
    private long platformNetRevenue;

    /** Tổng số tiền cần đối soát / chi trả cho các chủ gian hàng (Seller Payout) */
    private long sellerPayoutAmount;

    private long totalOrders;
    private long totalUsers;
    private long totalShops;
    private long activeShops;
    private long pendingRefunds;

    /** GMV phát sinh trong ngày hôm nay */
    private long todayRevenue;

    /** Doanh thu thực sàn thu được trong ngày hôm nay */
    private long todayNetRevenue;

    private long todayOrders;
    private long totalProducts;
}
