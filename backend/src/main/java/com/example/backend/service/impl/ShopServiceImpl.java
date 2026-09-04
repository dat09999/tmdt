package com.example.backend.service.impl;

import com.example.backend.DTO.common.ActionResponse;
import com.example.backend.DTO.shop.*;
import com.example.backend.mapper.ShopMapper;
import com.example.backend.module.Product;
import com.example.backend.module.ProductVariant;
import com.example.backend.module.Shop;
import com.example.backend.module.ShopFollow;
import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.ProductRepository;
import com.example.backend.repository.ShopFollowRepository;
import com.example.backend.repository.ShopRepository;
import com.example.backend.service.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ĐÃ SỬA CÁC LỖI CONCURRENCY / LOST UPDATE SO VỚI BẢN GỐC:
 *
 *  #22 createShop(): check "owner đã có shop chưa" rồi mới save() là TOCTOU - double-click
 *      tạo shop có thể sinh ra 2 shop cho cùng 1 owner. Fix: bắt DuplicateKeyException,
 *      NHƯNG cần bạn thêm unique index vào model Shop:
 *          @Indexed(unique = true)
 *          private String ownerId;
 *      Đây mới là nguồn đảm bảo thật, code chỉ bắt lỗi để báo thân thiện khi race xảy ra.
 *
 *  #23 followShop(): check exists() rồi mới save() cũng là TOCTOU - double-click "theo dõi"
 *      có thể tạo 2 record ShopFollow trùng, làm followerCount bị đếm dư. Fix: đổi sang
 *      mongoTemplate.upsert() với setOnInsert - thao tác này tự nhiên idempotent (gọi lại
 *      nhiều lần không tạo thêm record mới). Nên bổ sung thêm unique compound index vào
 *      model ShopFollow để chặn triệt để:
 *          @CompoundIndex(name = "uniq_user_shop", def = "{'userId': 1, 'shopId': 1}", unique = true)
 *
 *  #24 (phòng ngừa) updateShop(), updateStatus(), updateShopAvatar(), updateShopBanner(),
 *      deleteShop(): đổi từ đọc-sửa-ghi cả document sang atomic $set chỉ trên field cần đổi,
 *      để nhất quán với các file khác và phòng trường hợp 2 admin/seller thao tác cùng lúc
 *      trên cùng 1 shop (vd: admin ban shop đúng lúc seller tự sửa thông tin).
 *
 *  LƯU Ý: getShopStatistics() đọc field shop.getTotalSales() nhưng trong toàn bộ code đã
 *  rà soát từ đầu tới giờ CHƯA thấy chỗ nào set/tăng field này. Nếu có service khác đang
 *  cập nhật totalSales bằng đọc-sửa-ghi cả document Shop, nó sẽ mắc lại đúng lỗi #24 -
 *  cần kiểm tra riêng nếu bạn có file đó.
 */
@Service
@RequiredArgsConstructor
public class ShopServiceImpl implements ShopService {

    private final ShopRepository shopRepository;
    private final ShopFollowRepository shopFollowRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final ShopMapper shopMapper;
    private final MongoTemplate mongoTemplate;

    // =========================================================
    // CRUD SHOP
    // =========================================================

    /** Tạo shop mới và chặn một chủ shop đăng ký nhiều shop. */
    @Override
    public ShopResponse createShop(CreateShopRequest request) {
        String ownerId = requireText(request.getOwnerId(), "ownerId không được để trống");
        String shopName = requireText(request.getShopName(), "shopName không được để trống");

        // Check sớm để báo lỗi nhanh cho UX - nguồn đảm bảo thật sự là unique index ở DB
        // trên field ownerId (xem ghi chú DuplicateKeyException bên dưới).
        if (shopRepository.findByOwnerId(ownerId).isPresent()) {
            throw new RuntimeException("User này đã có shop rồi");
        }

        Date now = new Date();
        Shop shop = Shop.builder()
                .ownerId(ownerId)
                .shopName(shopName)
                .description(normalize(request.getDescription()))
                .phone(normalize(request.getPhone()))
                .email(normalize(request.getEmail()))
                .address(request.getAddress())
                .status("ACTIVE")
                .rating(0.0)
                .totalReviews(0)
                .totalSales(0)
                .createdAt(now)
                .updatedAt(now)
                .build();

        try {
            return toResponse(shopRepository.save(shop));
        } catch (DuplicateKeyException ex) {
            // Race condition lọt qua check ở trên -> unique index ở DB chặn lại.
            throw new RuntimeException("User này đã có shop rồi");
        }
    }

    /** Lấy toàn bộ shop ở dạng dữ liệu rút gọn để hiển thị danh sách. */
    @Override
    public List<ShopSummaryResponse> getAllShops() {
        return shopRepository.findAll()
                .stream()
                .map(this::toSummary)
                .toList();
    }

    /** Lấy chi tiết shop theo id. */
    @Override
    public ShopResponse getShopById(String shopId) {
        return toResponse(getShopOrThrow(shopId));
    }

    /** Lấy shop đầu tiên của owner; hỗ trợ dữ liệu cũ đang bị trùng ownerId. */
    @Override
    public ShopResponse getShopByOwnerId(String ownerId) {
        Shop shop = shopRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> new RuntimeException("User chưa có shop"));

        return toResponse(shop);
    }

    /** Chỉ cập nhật các trường request có gửi lên - đổi sang atomic $set. */
    @Override
    public ShopResponse updateShop(String shopId, CreateShopRequest request) {
        getShopOrThrow(shopId); // vẫn giữ để 404 sớm nếu shopId không tồn tại

        Update update = new Update().set("updatedAt", new Date());
        boolean hasChange = false;

        if (request.getShopName() != null) {
            update.set("shopName", request.getShopName().trim());
            hasChange = true;
        }
        if (request.getDescription() != null) {
            update.set("description", request.getDescription().trim());
            hasChange = true;
        }
        if (request.getPhone() != null) {
            update.set("phone", request.getPhone().trim());
            hasChange = true;
        }
        if (request.getEmail() != null) {
            update.set("email", request.getEmail().trim());
            hasChange = true;
        }
        if (request.getAddress() != null) {
            update.set("address", request.getAddress());
            hasChange = true;
        }

        if (!hasChange) {
            return toResponse(getShopOrThrow(shopId));
        }

        Shop updated = atomicUpdateShop(shopId, update);
        return toResponse(updated);
    }

    /** Chuyển trạng thái shop sang DELETED thay vì xóa document - atomic $set. */
    @Override
    public ActionResponse deleteShop(String shopId) {
        // Xóa mềm để vẫn giữ lại lịch sử đơn hàng và doanh thu.
        getShopOrThrow(shopId);
        Update update = new Update().set("status", "DELETED").set("updatedAt", new Date());
        atomicUpdateShop(shopId, update);

        return ActionResponse.builder()
                .success(true)
                .message("Đã xóa mềm shop")
                .build();
    }

    // =========================================================
    // TRẠNG THÁI SHOP
    // =========================================================

    /** Cập nhật trạng thái của shop theo giá trị truyền vào - atomic $set. */
    @Override
    public ShopResponse updateStatus(String shopId, String status) {
        getShopOrThrow(shopId);
        String newStatus = requireText(status, "status không được để trống").toUpperCase();

        Update update = new Update().set("status", newStatus).set("updatedAt", new Date());
        Shop updated = atomicUpdateShop(shopId, update);
        return toResponse(updated);
    }

    /** Lấy danh sách shop theo trạng thái để admin quản lý. */
    @Override
    public List<ShopSummaryResponse> getShopsByStatus(String status) {
        return shopRepository.findByStatus(status.toUpperCase())
                .stream()
                .map(this::toSummary)
                .toList();
    }

    /** Duyệt shop và chuyển trạng thái sang ACTIVE. */
    @Override
    public ShopResponse approveShop(String shopId) {
        return updateStatus(shopId, "ACTIVE");
    }

    /** Khóa shop vi phạm; tham số reason có thể lưu vào model sau này. */
    @Override
    public ShopResponse banShop(String shopId, String reason) {
        // reason nên được bổ sung vào field banReason nếu cần hiển thị cho seller.
        return updateStatus(shopId, "BANNED");
    }

    /** Khôi phục shop đã bị khóa hoặc xóa mềm. */
    @Override
    public ShopResponse restoreShop(String shopId) {
        return updateStatus(shopId, "ACTIVE");
    }

    // =========================================================
    // TÌM KIẾM VÀ PHÂN TRANG
    // =========================================================

    /** Tìm shop theo một phần tên shop. */
    @Override
    public List<ShopSummaryResponse> searchByName(String keyword) {
        return shopRepository.findByShopNameContainingIgnoreCase(normalize(keyword))
                .stream()
                .map(this::toSummary)
                .toList();
    }

    /** Lấy danh sách shop có phân trang. */
    @Override
    public Page<ShopSummaryResponse> getShopsPaged(Pageable pageable) {
        return shopRepository.findAll(pageable).map(this::toSummary);
    }

    /** Tìm shop theo tên kèm phân trang. */
    @Override
    public Page<ShopSummaryResponse> searchShopsPaged(String keyword, Pageable pageable) {
        return shopRepository
                .findByShopNameContainingIgnoreCase(normalize(keyword), pageable)
                .map(this::toSummary);
    }

    // =========================================================
    // DASHBOARD
    // =========================================================

    /** Tổng hợp số sản phẩm, đơn, doanh thu, số bán và rating của shop. */
    @Override
    public ShopStatisticsResponse getShopStatistics(String shopId) {
        Shop shop = getShopOrThrow(shopId);

        // Chỉ gọi orderRepository 1 lần thay vì 2 lần như bản gốc (tối ưu, không phải fix
        // concurrency, chỉ tiện sửa luôn vì đang động vào hàm này).
        List<com.example.backend.module.Order> shopOrders =
                orderRepository.findByShopIdOrderByCreatedAtDesc(shopId);

        long orderCount = shopOrders.size();
        long revenue = shopOrders.stream()
                .filter(order -> "COMPLETED".equalsIgnoreCase(order.getOrderStatus()))
                .mapToLong(order -> order.getTotalAmount() == null ? 0 : order.getTotalAmount())
                .sum();

        return ShopStatisticsResponse.builder()
                .shopId(shopId)
                .productCount(productRepository.findByShopId(shopId).size())
                .orderCount(orderCount)
                .totalSales(shop.getTotalSales() == null ? 0 : shop.getTotalSales())
                .averageRating(shop.getRating() == null ? 0 : shop.getRating())
                .revenue(revenue)
                .build();
    }

    @Override
    public List<DailyRevenueResponse> getRevenueAnalytics(String shopId, int days) {
        getShopOrThrow(shopId);
        int validDays = (days <= 0 || days > 90) ? 7 : days;

        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(validDays - 1);
        Date startDateTime = Date.from(startDate.atStartOfDay(ZoneId.systemDefault()).toInstant());

        List<com.example.backend.module.Order> shopOrders =
                orderRepository.findByShopIdOrderByCreatedAtDesc(shopId);

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");

        Map<String, List<com.example.backend.module.Order>> ordersByDate = shopOrders.stream()
                .filter(o -> o.getCreatedAt() != null && !o.getCreatedAt().before(startDateTime))
                .filter(o -> "COMPLETED".equalsIgnoreCase(o.getOrderStatus()))
                .collect(Collectors.groupingBy(o -> sdf.format(o.getCreatedAt())));

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        List<DailyRevenueResponse> result = new ArrayList<>();

        for (int i = 0; i < validDays; i++) {
            LocalDate d = startDate.plusDays(i);
            String dateStr = d.format(dtf);
            List<com.example.backend.module.Order> dailyOrders = ordersByDate.getOrDefault(dateStr, Collections.emptyList());

            long dailyRevenue = dailyOrders.stream()
                    .mapToLong(o -> o.getTotalAmount() == null ? 0 : o.getTotalAmount())
                    .sum();

            result.add(DailyRevenueResponse.builder()
                    .date(dateStr)
                    .revenue(dailyRevenue)
                    .orderCount(dailyOrders.size())
                    .build());
        }

        return result;
    }

    @Override
    public OrderStatusDistributionResponse getOrderStatusAnalytics(String shopId) {
        getShopOrThrow(shopId);
        List<com.example.backend.module.Order> shopOrders =
                orderRepository.findByShopIdOrderByCreatedAtDesc(shopId);

        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("PENDING", 0L);
        counts.put("PROCESSING", 0L);
        counts.put("SHIPPING", 0L);
        counts.put("COMPLETED", 0L);
        counts.put("CANCELED", 0L);
        counts.put("REFUNDED", 0L);

        for (com.example.backend.module.Order order : shopOrders) {
            String status = order.getOrderStatus() != null ? order.getOrderStatus().toUpperCase() : "PENDING";
            counts.put(status, counts.getOrDefault(status, 0L) + 1);
        }

        return OrderStatusDistributionResponse.builder()
                .statusCounts(counts)
                .totalOrders(shopOrders.size())
                .build();
    }

    @Override
    public List<TopProductResponse> getTopSellingProducts(String shopId, int limit) {
        getShopOrThrow(shopId);
        int validLimit = (limit <= 0 || limit > 50) ? 5 : limit;

        List<Product> products = productRepository.findByShopId(shopId);

        return products.stream()
                .sorted((p1, p2) -> {
                    int s1 = p1.getSoldCount() != null ? p1.getSoldCount() : 0;
                    int s2 = p2.getSoldCount() != null ? p2.getSoldCount() : 0;
                    return Integer.compare(s2, s1);
                })
                .limit(validLimit)
                .map(p -> {
                    String img = null;
                    if (p.getImages() != null && !p.getImages().isEmpty()) {
                        img = p.getImages().get(0).getUrl();
                    }
                    int sold = p.getSoldCount() != null ? p.getSoldCount() : 0;
                    long price = p.getBasePrice() != null ? p.getBasePrice() : 0;
                    return TopProductResponse.builder()
                            .productId(p.getId())
                            .productName(p.getName())
                            .imageUrl(img)
                            .basePrice(price)
                            .soldCount(sold)
                            .revenue(sold * price)
                            .build();
                })
                .toList();
    }

    @Override
    public List<LowStockResponse> getLowStockAlerts(String shopId, int threshold) {
        getShopOrThrow(shopId);
        int validThreshold = (threshold < 0) ? 5 : threshold;

        List<Product> products = productRepository.findByShopId(shopId);
        List<LowStockResponse> alerts = new ArrayList<>();

        for (Product product : products) {
            if (product.getVariants() != null) {
                for (ProductVariant variant : product.getVariants()) {
                    int stock = variant.getStock() != null ? variant.getStock() : 0;
                    if (stock <= validThreshold) {
                        alerts.add(LowStockResponse.builder()
                                .productId(product.getId())
                                .productName(product.getName())
                                .sku(variant.getSku())
                                .color(variant.getColor())
                                .size(variant.getSize())
                                .stock(stock)
                                .build());
                    }
                }
            }
        }

        alerts.sort(Comparator.comparingInt(LowStockResponse::getStock));
        return alerts;
    }

    @Override
    public ShopDashboardResponse getDashboardOverview(String shopId, int days) {
        return ShopDashboardResponse.builder()
                .summary(getShopStatistics(shopId))
                .revenueChart(getRevenueAnalytics(shopId, days))
                .orderStatusDistribution(getOrderStatusAnalytics(shopId))
                .topProducts(getTopSellingProducts(shopId, 5))
                .lowStockAlerts(getLowStockAlerts(shopId, 5))
                .build();
    }

    // =========================================================
    // FOLLOW SHOP
    // =========================================================

    /**
     * FIX #23: đổi sang upsert atomic thay vì check exists() rồi mới save(). Thao tác
     * upsert tự nhiên idempotent - gọi lại nhiều lần (double-click) không tạo thêm record
     * trùng, vì query điều kiện (userId, shopId) dùng để match document đã tồn tại.
     * Khuyến nghị bổ sung thêm unique compound index (userId, shopId) trên ShopFollow để
     * chặn triệt để trường hợp cực hiếm 2 request đến cùng 1 nanosecond.
     */
    @Override
    public FollowShopResponse followShop(String userId, String shopId) {
        getShopOrThrow(shopId);

        Query query = Query.query(Criteria.where("userId").is(userId).and("shopId").is(shopId));
        Update update = new Update()
                .setOnInsert("userId", userId)
                .setOnInsert("shopId", shopId)
                .setOnInsert("createdAt", new Date());

        try {
            mongoTemplate.upsert(query, update, ShopFollow.class);
        } catch (DuplicateKeyException ex) {
            // Đã follow rồi (race hiếm gặp lọt qua) -> bỏ qua an toàn, coi như thành công.
        }

        return buildFollowResponse(userId, shopId, "Đã theo dõi shop");
    }

    /** Xóa lượt theo dõi shop của user. */
    @Override
    public FollowShopResponse unfollowShop(String userId, String shopId) {
        shopFollowRepository.deleteByUserIdAndShopId(userId, shopId);
        return buildFollowResponse(userId, shopId, "Đã bỏ theo dõi shop");
    }

    /** Trả trạng thái theo dõi hiện tại và tổng follower của shop. */
    @Override
    public FollowShopResponse getFollowStatus(String userId, String shopId) {
        return buildFollowResponse(userId, shopId, null);
    }

    // =========================================================
    // QUYỀN SỞ HỮU VÀ ẢNH SHOP
    // =========================================================

    /** Kiểm tra user có phải chủ shop để dùng cho phân quyền. */
    @Override
    public ShopOwnershipResponse checkOwnership(String shopId, String userId) {
        boolean owner = getShopOrThrow(shopId).getOwnerId().equals(userId);

        return ShopOwnershipResponse.builder()
                .shopId(shopId)
                .userId(userId)
                .owner(owner)
                .message(owner ? "Bạn là chủ shop" : "Bạn không phải chủ shop")
                .build();
    }

    /** Lưu object key logo shop sau khi upload file lên MinIO - atomic $set. */
    @Override
    public ShopResponse updateShopAvatar(String shopId, String logoKey) {
        getShopOrThrow(shopId);
        String key = requireText(logoKey, "logoKey không được để trống");

        Update update = new Update().set("logo", key).set("updatedAt", new Date());
        Shop updated = atomicUpdateShop(shopId, update);
        return toResponse(updated);
    }

    /** Lưu object key ảnh bìa shop sau khi upload file lên MinIO - atomic $set. */
    @Override
    public ShopResponse updateShopBanner(String shopId, String coverKey) {
        getShopOrThrow(shopId);
        String key = requireText(coverKey, "coverKey không được để trống");

        Update update = new Update().set("coverImage", key).set("updatedAt", new Date());
        Shop updated = atomicUpdateShop(shopId, update);
        return toResponse(updated);
    }

    // =========================================================
    // HELPER METHODS
    // =========================================================

    private Shop getShopOrThrow(String shopId) {
        return shopRepository.findById(shopId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy shop"));
    }

    /** Helper dùng chung cho mọi thao tác atomic $set trên Shop. */
    private Shop atomicUpdateShop(String shopId, Update update) {
        Query query = Query.query(Criteria.where("_id").is(shopId));
        Shop updated = mongoTemplate.findAndModify(query, update,
                FindAndModifyOptions.options().returnNew(true), Shop.class);
        if (updated == null) {
            throw new RuntimeException("Không tìm thấy shop");
        }
        return updated;
    }

    private ShopResponse toResponse(Shop shop) {
        return shopMapper.toResponse(shop);
    }

    private ShopSummaryResponse toSummary(Shop shop) {
        return ShopSummaryResponse.builder()
                .id(shop.getId())
                .shopName(shop.getShopName())
                .logo(shop.getLogo())
                .status(shop.getStatus())
                .rating(shop.getRating() == null ? 0.0 : shop.getRating())
                .totalSales(shop.getTotalSales() == null ? 0 : shop.getTotalSales())
                .build();
    }

    private FollowShopResponse buildFollowResponse(String userId, String shopId, String message) {
        return FollowShopResponse.builder()
                .shopId(shopId)
                .following(shopFollowRepository.existsByUserIdAndShopId(userId, shopId))
                .followerCount(shopFollowRepository.countByShopId(shopId))
                .message(message)
                .build();
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private String requireText(String value, String message) {
        String result = normalize(value);
        if (result.isBlank()) {
            throw new RuntimeException(message);
        }
        return result;
    }
}