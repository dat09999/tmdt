package com.example.backend.service.impl;

import com.example.backend.DTO.admin.AdminOverviewResponse;
import com.example.backend.DTO.admin.TopShopResponse;
import com.example.backend.DTO.shop.DailyRevenueResponse;
import com.example.backend.DTO.shop.OrderStatusDistributionResponse;
import com.example.backend.DTO.shop.TopProductResponse;
import com.example.backend.module.Order;
import com.example.backend.module.Product;
import com.example.backend.module.RefundRequest;
import com.example.backend.module.Shop;
import com.example.backend.module.User;
import com.example.backend.repository.ProductRepository;
import com.example.backend.repository.ShopRepository;
import com.example.backend.service.AdminAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminAnalyticsServiceImpl implements AdminAnalyticsService {

    private final MongoTemplate mongoTemplate;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final com.example.backend.service.PlatformConfigService platformConfigService;

    private static final Set<String> REVENUE_STATUSES = Set.of("COMPLETED", "DELIVERED", "SHIPPING", "PROCESSING");

    @Override
    public AdminOverviewResponse getOverview() {
        long totalOrders = mongoTemplate.count(new Query(), Order.class);
        long totalUsers = mongoTemplate.count(new Query(), User.class);
        long totalShops = mongoTemplate.count(new Query(), Shop.class);
        long activeShops = mongoTemplate.count(Query.query(Criteria.where("status").is("ACTIVE")), Shop.class);
        long totalProducts = mongoTemplate.count(new Query(), Product.class);
        long pendingRefunds = mongoTemplate.count(Query.query(Criteria.where("status").is("PENDING")), RefundRequest.class);

        // Tổng doanh thu toàn sàn (các đơn đã hoàn thành/giao hàng)
        Aggregation revenueAgg = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("orderStatus").in("COMPLETED", "DELIVERED")),
                Aggregation.group().sum("totalAmount").as("totalRevenue")
        );
        AggregationResults<Document> revResult = mongoTemplate.aggregate(revenueAgg, "orders", Document.class);
        long totalRevenue = 0L;
        if (!revResult.getMappedResults().isEmpty()) {
            Number num = (Number) revResult.getMappedResults().get(0).get("totalRevenue");
            if (num != null) totalRevenue = num.longValue();
        }

        // Doanh thu và đơn hàng hôm nay
        LocalDate today = LocalDate.now();
        Date startOfToday = Date.from(today.atStartOfDay(ZoneId.systemDefault()).toInstant());
        Query todayOrdersQuery = Query.query(Criteria.where("createdAt").gte(startOfToday));
        long todayOrders = mongoTemplate.count(todayOrdersQuery, Order.class);

        Aggregation todayRevAgg = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("createdAt").gte(startOfToday)
                        .and("orderStatus").in("COMPLETED", "DELIVERED")),
                Aggregation.group().sum("totalAmount").as("todayRevenue")
        );
        AggregationResults<Document> todayRevResult = mongoTemplate.aggregate(todayRevAgg, "orders", Document.class);
        long todayRevenue = 0L;
        if (!todayRevResult.getMappedResults().isEmpty()) {
            Number num = (Number) todayRevResult.getMappedResults().get(0).get("todayRevenue");
            if (num != null) todayRevenue = num.longValue();
        }

        // Tính toán chiết khấu hoa hồng sàn và tiền chi trả cho Shop
        com.example.backend.module.PlatformConfig config = platformConfigService.getConfig();
        double commissionRate = (config != null && config.getCommissionRate() != null) ? config.getCommissionRate() : 5.0;
        long platformNetRevenue = Math.round(totalRevenue * (commissionRate / 100.0));
        long sellerPayoutAmount = Math.max(0L, totalRevenue - platformNetRevenue);
        long todayNetRevenue = Math.round(todayRevenue * (commissionRate / 100.0));

        return AdminOverviewResponse.builder()
                .totalRevenue(totalRevenue)
                .commissionRate(commissionRate)
                .platformNetRevenue(platformNetRevenue)
                .sellerPayoutAmount(sellerPayoutAmount)
                .todayNetRevenue(todayNetRevenue)
                .totalOrders(totalOrders)
                .totalUsers(totalUsers)
                .totalShops(totalShops)
                .activeShops(activeShops)
                .pendingRefunds(pendingRefunds)
                .todayRevenue(todayRevenue)
                .todayOrders(todayOrders)
                .totalProducts(totalProducts)
                .build();
    }

    @Override
    public List<DailyRevenueResponse> getRevenueAnalytics(String startDate, String endDate, Integer days) {
        LocalDate start;
        LocalDate end;

        if (startDate != null && !startDate.isBlank() && endDate != null && !endDate.isBlank()) {
            try {
                start = LocalDate.parse(startDate.trim());
                end = LocalDate.parse(endDate.trim());
            } catch (Exception e) {
                int validDays = (days != null && days > 0 && days <= 90) ? days : 10;
                end = LocalDate.now();
                start = end.minusDays(validDays - 1);
            }
        } else {
            int validDays = (days != null && days > 0 && days <= 90) ? days : 10;
            end = LocalDate.now();
            start = end.minusDays(validDays - 1);
        }

        if (start.isAfter(end)) {
            LocalDate temp = start;
            start = end;
            end = temp;
        }

        if (java.time.temporal.ChronoUnit.DAYS.between(start, end) > 90) {
            start = end.minusDays(89);
        }

        Date startDateTime = Date.from(start.atStartOfDay(ZoneId.systemDefault()).toInstant());
        Date endDateTime = Date.from(end.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant());

        Query query = Query.query(
                Criteria.where("createdAt").gte(startDateTime).lt(endDateTime)
                        .and("orderStatus").in("COMPLETED", "DELIVERED")
        );
        List<Order> orders = mongoTemplate.find(query, Order.class);

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        Map<String, List<Order>> ordersByDate = orders.stream()
                .filter(o -> o.getCreatedAt() != null)
                .collect(Collectors.groupingBy(o -> sdf.format(o.getCreatedAt())));

        long totalDays = java.time.temporal.ChronoUnit.DAYS.between(start, end) + 1;
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        List<DailyRevenueResponse> result = new ArrayList<>();

        for (int i = 0; i < totalDays; i++) {
            LocalDate d = start.plusDays(i);
            String dateStr = d.format(dtf);
            List<Order> dailyOrders = ordersByDate.getOrDefault(dateStr, Collections.emptyList());

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
    public List<TopShopResponse> getTopShops(int limit) {
        int validLimit = (limit <= 0 || limit > 50) ? 5 : limit;

        Aggregation agg = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("orderStatus").in("COMPLETED", "DELIVERED")),
                Aggregation.group("shopId")
                        .sum("totalAmount").as("revenue")
                        .count().as("orderCount"),
                Aggregation.sort(Sort.Direction.DESC, "revenue"),
                Aggregation.limit(validLimit)
        );

        AggregationResults<Document> results = mongoTemplate.aggregate(agg, "orders", Document.class);
        List<TopShopResponse> list = new ArrayList<>();

        for (Document doc : results.getMappedResults()) {
            String shopId = doc.getString("_id");
            if (shopId == null) continue;

            Number rev = (Number) doc.get("revenue");
            Number ordCount = (Number) doc.get("orderCount");

            Shop shop = shopRepository.findById(shopId).orElse(null);
            String shopName = shop != null ? shop.getShopName() : "Shop #" + shopId;
            long productCount = productRepository.countByShopId(shopId);

            list.add(TopShopResponse.builder()
                    .shopId(shopId)
                    .shopName(shopName)
                    .revenue(rev != null ? rev.longValue() : 0L)
                    .orderCount(ordCount != null ? ordCount.longValue() : 0L)
                    .productCount(productCount)
                    .build());
        }

        return list;
    }

    @Override
    public List<TopProductResponse> getTopSellingProducts(int limit) {
        int validLimit = (limit <= 0 || limit > 50) ? 5 : limit;

        Query query = new Query().with(Sort.by(Sort.Direction.DESC, "soldCount")).limit(validLimit);
        List<Product> products = mongoTemplate.find(query, Product.class);

        return products.stream().map(p -> {
            String img = null;
            if (p.getImages() != null && !p.getImages().isEmpty()) {
                img = p.getImages().get(0).getUrl();
            }
            int sold = p.getSoldCount() != null ? p.getSoldCount() : 0;
            long price = p.getBasePrice() != null ? p.getBasePrice() : 0L;
            return TopProductResponse.builder()
                    .productId(p.getId())
                    .productName(p.getName())
                    .imageUrl(img)
                    .basePrice(price)
                    .soldCount(sold)
                    .revenue(sold * price)
                    .build();
        }).toList();
    }

    @Override
    public OrderStatusDistributionResponse getOrderStatusDistribution() {
        Aggregation agg = Aggregation.newAggregation(
                Aggregation.group("orderStatus").count().as("count")
        );
        AggregationResults<Document> results = mongoTemplate.aggregate(agg, "orders", Document.class);

        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("PENDING", 0L);
        counts.put("PROCESSING", 0L);
        counts.put("SHIPPING", 0L);
        counts.put("COMPLETED", 0L);
        counts.put("CANCELED", 0L);
        counts.put("REFUNDED", 0L);

        long total = 0L;
        for (Document doc : results.getMappedResults()) {
            String status = doc.getString("_id");
            Number c = (Number) doc.get("count");
            if (status != null && c != null) {
                counts.put(status.toUpperCase(), c.longValue());
                total += c.longValue();
            }
        }

        return OrderStatusDistributionResponse.builder()
                .statusCounts(counts)
                .totalOrders((int) total)
                .build();
    }
}
