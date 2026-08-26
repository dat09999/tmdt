package com.example.backend.service;

import com.example.backend.DTO.common.ActionResponse;
import com.example.backend.DTO.shop.CreateShopRequest;
import com.example.backend.DTO.shop.FollowShopResponse;
import com.example.backend.DTO.shop.ShopOwnershipResponse;
import com.example.backend.DTO.shop.ShopResponse;
import com.example.backend.DTO.shop.ShopStatisticsResponse;
import com.example.backend.DTO.shop.ShopSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Xử lý tất cả nghiệp vụ liên quan đến shop.
 *
 * Controller không nên trả entity Shop trực tiếp; toàn bộ dữ liệu trả về
 * cho frontend đều dùng DTO để tránh lộ dữ liệu nội bộ.
 */
public interface ShopService {

    // =========================================================
    // CRUD SHOP
    // =========================================================

    /**
     * Đăng ký một shop mới cho người dùng.
     * Mỗi ownerId chỉ nên có một shop.
     */
    ShopResponse createShop(CreateShopRequest request);

    /** Lấy danh sách shop công khai. */
    List<ShopSummaryResponse> getAllShops();

    /** Lấy thông tin đầy đủ của một shop theo id. */
    ShopResponse getShopById(String shopId);

    /** Lấy shop của một chủ shop. */
    ShopResponse getShopByOwnerId(String ownerId);

    /** Cập nhật tên, mô tả, liên hệ và địa chỉ shop. */
    ShopResponse updateShop(String shopId, CreateShopRequest request);

    /**
     * Xóa mềm shop bằng cách chuyển trạng thái thành DELETED.
     * Không xóa document thật để bảo toàn lịch sử đơn hàng.
     */
    ActionResponse deleteShop(String shopId);


    // =========================================================
    // TRẠNG THÁI SHOP - ADMIN
    // =========================================================

    /** Cập nhật trạng thái: PENDING, ACTIVE, INACTIVE, BANNED hoặc DELETED. */
    ShopResponse updateStatus(String shopId, String status);

    /** Admin duyệt shop và chuyển trạng thái sang ACTIVE. */
    ShopResponse approveShop(String shopId);

    /** Admin khóa shop vi phạm. Lý do có thể được lưu thêm sau này. */
    ShopResponse banShop(String shopId, String reason);

    /** Admin khôi phục shop đã bị khóa hoặc xóa mềm. */
    ShopResponse restoreShop(String shopId);

    /** Lấy shop theo trạng thái để admin quản lý. */
    List<ShopSummaryResponse> getShopsByStatus(String status);


    // =========================================================
    // TÌM KIẾM VÀ PHÂN TRANG
    // =========================================================

    /** Tìm shop theo một phần tên shop. */
    List<ShopSummaryResponse> searchByName(String keyword);

    /** Lấy danh sách shop có phân trang. */
    Page<ShopSummaryResponse> getShopsPaged(Pageable pageable);

    /** Tìm kiếm shop có phân trang. */
    Page<ShopSummaryResponse> searchShopsPaged(
            String keyword,
            Pageable pageable
    );


    // =========================================================
    // DASHBOARD / THỐNG KÊ SHOP
    // =========================================================

    /**
     * Trả dữ liệu dashboard: số sản phẩm, số đơn,
     * doanh thu hoàn thành, tổng đã bán và rating.
     */
    ShopStatisticsResponse getShopStatistics(String shopId);


    // =========================================================
    // THEO DÕI SHOP
    // =========================================================

    /** User theo dõi shop. */
    FollowShopResponse followShop(String userId, String shopId);

    /** User bỏ theo dõi shop. */
    FollowShopResponse unfollowShop(String userId, String shopId);

    /** Kiểm tra user có đang theo dõi shop, đồng thời trả tổng follower. */
    FollowShopResponse getFollowStatus(String userId, String shopId);


    // =========================================================
    // QUYỀN SỞ HỮU VÀ MEDIA
    // =========================================================

    /** Kiểm tra user có phải chủ shop hay không. */
    ShopOwnershipResponse checkOwnership(String shopId, String userId);

    /** Lưu object key logo sau khi ảnh đã upload lên MinIO. */
    ShopResponse updateShopAvatar(String shopId, String logoKey);

    /** Lưu object key ảnh bìa sau khi ảnh đã upload lên MinIO. */
    ShopResponse updateShopBanner(String shopId, String coverKey);
}
