package com.example.backend.service.impl;

import com.example.backend.DTO.order.BuyNowOrderRequest;
import com.example.backend.DTO.order.CreateOrderRequest;
import com.example.backend.module.*;
import com.example.backend.repository.*;
import com.example.backend.service.OrderService;
import com.example.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * ĐÃ SỬA CÁC LỖI CONCURRENCY / LOST UPDATE SO VỚI BẢN GỐC:
 *
 *  #1 markPaymentSuccess: webhook gọi trùng -> đổi sang findAndModify có điều kiện
 *  #2 coupon usedCount: đổi sang atomic $inc, chỉ chạy khi findAndModify #1 thành công
 *  #3 cancelOrder / markPaymentSuccess / markPaymentFailed / updateOrderStatus / startShipping:
 *     race condition đổi trạng thái -> tất cả đổi sang findAndModify có điều kiện trạng thái hiện tại
 *  #4 createOrderFromCart: 1 shop lỗi giữa chừng -> tự động rollback (cancel) các order đã tạo trước đó
 *     trong cùng lần checkout, chỉ update cart SAU KHI toàn bộ order tạo thành công
 *  #5 @Transactional: đã BỎ khỏi createOrderFromCart/createOrderDirect vì MongoDB standalone
 *     không hỗ trợ transaction thật (annotation này trước đây không có tác dụng, dễ gây hiểu lầm).
 *     Nếu bạn dùng MongoDB replica set + có bean MongoTransactionManager, có thể thêm lại.
 *  #6 cancelExpiredPendingOrders: đổi sang findAndModify có điều kiện, giảm rủi ro xử lý trùng
 *     khi chạy nhiều instance (LƯU Ý: nếu scale >1 instance, vẫn nên thêm ShedLock/Redis lock
 *     cho chính cron job này, code dưới chưa bao gồm phần đó).
 *  #7 removeItemsFromCart: dùng $pull thay vì đọc-sửa-ghi toàn bộ mảng items của cart
 *  #8 coupon TOCTOU: giảm thiểu bằng việc chỉ cộng usedCount atomic tại thời điểm thanh toán
 *     thành công (không giải quyết triệt để trường hợp validate-race lúc tạo order, xem ghi chú
 *     ở validateCoupon()).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CouponRepository couponRepository;
    private final ProductRepository productRepository;
    private final MongoTemplate mongoTemplate;
    private final NotificationService notificationService;

    // ĐÃ THÊM: thông báo trạng thái đơn hàng (notify buyer) tại các điểm đổi trạng thái
    // quan trọng - markPaymentSuccess, cancelOrder, markPaymentFailed, startShipping,
    // cancelExpiredPendingOrders. Mỗi notify() chỉ gọi SAU KHI findAndModify atomic đã
    // xác nhận thành công, để không gửi thông báo sai nếu update bị chặn do race condition.
    // TODO: xác nhận đúng giá trị enum Notification.NotificationType bạn đang có (đang
    // dùng "ORDER" - đổi lại cho khớp enum thật nếu tên khác).

    private static final Set<String> TERMINAL_STATUSES = Set.of("COMPLETED", "DELIVERED", "CANCELED");
    private static final long SHIPPING_FEE = 30000L;

    // ================== TẠO ĐƠN TỪ GIỎ HÀNG ==================

    @Override
    public List<Order> createOrderFromCart(CreateOrderRequest request) {
        log.info("createOrderFromCart - buyerId={}", request.getBuyerId());

        Cart cart = cartRepository.findByUserId(request.getBuyerId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng"));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new RuntimeException("Giỏ hàng đang trống");
        }

        Set<CartItemKey> selectedKeys = request.getSelectedItems().stream()
                .map(item -> new CartItemKey(item.getProductId(), item.getVariantSku()))
                .collect(java.util.stream.Collectors.toSet());

        if (selectedKeys.size() != request.getSelectedItems().size()) {
            throw new RuntimeException("Danh sách sản phẩm được chọn bị trùng");
        }

        List<CartItem> selectedCartItems = cart.getItems().stream()
                .filter(item -> selectedKeys.contains(
                        new CartItemKey(item.getProductId(), item.getVariantSku())))
                .toList();

        if (selectedCartItems.size() != selectedKeys.size()) {
            throw new RuntimeException("Có sản phẩm được chọn không còn tồn tại trong giỏ hàng");
        }

        Map<String, List<CartItem>> itemsByShop = selectedCartItems.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        CartItem::getShopId,
                        LinkedHashMap::new,
                        java.util.stream.Collectors.toList()
                ));

        Map<String, Product> productCache = new HashMap<>();
        List<Order> savedOrders = new ArrayList<>();

        // ---- FIX #4: nếu 1 shop lỗi giữa chừng, rollback (cancel) toàn bộ order
        //      đã tạo thành công trước đó trong CÙNG lần checkout này ----
        try {
            for (Map.Entry<String, List<CartItem>> shopEntry : itemsByShop.entrySet()) {

                List<OrderLine> lines = shopEntry.getValue().stream()
                        .map(item -> new OrderLine(
                                item.getProductId(),
                                item.getVariantSku(),
                                item.getQuantity(),
                                item.getPrice()
                        ))
                        .toList();

                BuildResult built = buildOrderItems(lines, productCache);

                if (!Objects.equals(shopEntry.getKey(), built.shopId)) {
                    throw new RuntimeException(
                            "Shop không khớp: expected=" + shopEntry.getKey() + ", actual=" + built.shopId);
                }

                Order savedOrder = finalizeOrder(
                        request.getBuyerId(),
                        built.shopId,
                        built,
                        request.getCouponCode(),
                        request.getShippingAddress(),
                        request.getNote(),
                        request.getPaymentMethod()
                );
                log.info("Tạo order thành công orderId={}, shopId={}", savedOrder.getId(), built.shopId);
                savedOrders.add(savedOrder);
            }
        } catch (RuntimeException ex) {
            log.error("Checkout lỗi giữa chừng, tiến hành rollback {} order đã tạo trước đó",
                    savedOrders.size(), ex);
            for (Order order : savedOrders) {
                try {
                    cancelOrder(order.getId(), "SYSTEM",
                            "Tự động hủy do checkout thất bại ở shop khác trong cùng đơn");
                } catch (RuntimeException rollbackEx) {
                    log.error("KHÔNG THỂ rollback order {} sau khi checkout lỗi - cần xử lý thủ công!",
                            order.getId(), rollbackEx);
                }
            }
            throw ex;
        }

        // ---- chỉ update cart SAU KHI toàn bộ order đã tạo thành công ----
        removeItemsFromCart(request.getBuyerId(), selectedKeys);

        return savedOrders;
    }

    // ================== MUA NGAY (KHÔNG QUA GIỎ HÀNG) ==================

    @Override
    public Order createOrderDirect(BuyNowOrderRequest request) {
        if (request.getQuantity() <= 0) {
            throw new RuntimeException("Số lượng phải lớn hơn 0");
        }

        Map<String, Product> productCache = new HashMap<>();

        List<OrderLine> lines = List.of(new OrderLine(
                request.getProductId(), request.getVariantSku(), request.getQuantity(), null));

        BuildResult built = buildOrderItems(lines, productCache);

        return finalizeOrder(
                request.getBuyerId(),
                built.shopId,
                built,
                request.getCouponCode(),
                request.getShippingAddress(),
                request.getNote(),
                request.getPaymentMethod()
        );
    }

    // ================== LOGIC DÙNG CHUNG ==================

    private record OrderLine(String productId, String variantSku, int quantity, Long expectedPrice) {}

    private record CartItemKey(String productId, String variantSku) {}

    private static class BuildResult {
        String shopId;
        List<OrderItem> orderItems = new ArrayList<>();
        Map<String, Integer> requiredQtyByVariant = new HashMap<>();
        Map<String, Product> productCache;
        long subtotal;
    }

    private BuildResult buildOrderItems(List<OrderLine> lines, Map<String, Product> productCache) {
        if (lines.isEmpty()) {
            throw new RuntimeException("Không có sản phẩm nào để đặt hàng");
        }

        BuildResult result = new BuildResult();
        result.productCache = productCache;

        for (OrderLine line : lines) {
            if (line.quantity() <= 0) {
                throw new RuntimeException("Số lượng không hợp lệ");
            }

            Product product = productCache.computeIfAbsent(
                    line.productId(),
                    id -> productRepository.findById(id)
                            .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"))
            );

            if (result.shopId == null) {
                result.shopId = product.getShopId();
            } else if (!result.shopId.equals(product.getShopId())) {
                throw new RuntimeException(
                        "Đơn hàng chỉ được chứa sản phẩm từ 1 shop, vui lòng đặt hàng từng shop riêng");
            }

            if (!"ACTIVE".equalsIgnoreCase(product.getStatus())) {
                throw new RuntimeException("Sản phẩm \"" + product.getName() + "\" không còn hoạt động");
            }

            ProductVariant variant = findVariant(product, line.variantSku());

            if (!Boolean.TRUE.equals(variant.getActive())) {
                throw new RuntimeException("Phân loại sản phẩm \"" + product.getName() + "\" không còn hoạt động");
            }

            if (line.expectedPrice() != null && !Objects.equals(variant.getPrice(), line.expectedPrice())) {
                log.warn("Giá thay đổi: productId={}, sku={}, expectedPrice={}, currentPrice={}",
                        product.getId(), variant.getSku(), line.expectedPrice(), variant.getPrice());
            }

            String key = buildVariantKey(product.getId(), variant.getSku());
            int totalNeed = result.requiredQtyByVariant.getOrDefault(key, 0) + line.quantity();

            // Check này chỉ để fail sớm cho UX, giá trị thật sự được đảm bảo atomic
            // ở decrementStockAtomic() bên dưới - không phải nguồn gây lost update.
            if (variant.getStock() == null || variant.getStock() < totalNeed) {
                throw new RuntimeException("Số lượng tồn kho không đủ cho sản phẩm: " + product.getName());
            }
            result.requiredQtyByVariant.put(key, totalNeed);

            long unitPrice = variant.getPrice();
            long totalPrice = unitPrice * line.quantity();
            result.subtotal += totalPrice;

            result.orderItems.add(OrderItem.builder()
                    .productId(product.getId())
                    .shopId(product.getShopId())
                    .variantSku(variant.getSku())
                    .productName(product.getName())
                    .unitPrice(unitPrice)
                    .quantity(line.quantity())
                    .totalPrice(totalPrice)
                    .build());
        }

        return result;
    }

    private Order finalizeOrder(String buyerId, String shopId, BuildResult built,
                                String couponCode, Address shippingAddress, String note, String paymentMethod) {

        Coupon coupon = null;
        long discountAmount = 0L;
        if (couponCode != null && !couponCode.isBlank()) {
            coupon = couponRepository.findByCode(couponCode.trim().toUpperCase())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy coupon"));
            validateCoupon(coupon, built.subtotal);
            discountAmount = calculateDiscount(coupon, built.subtotal);
            // LƯU Ý (lỗi #8 - TOCTOU): validateCoupon() chỉ check usageLimit tại thời điểm
            // ĐỌC, chưa "giữ chỗ" ngay lúc này. Việc cộng usedCount atomic thật sự chỉ xảy ra
            // ở markPaymentSuccess() khi thanh toán thành công. Nếu bạn cần chặn tuyệt đối
            // việc coupon bị đặt vượt quá usageLimit ngay từ bước TẠO đơn (chưa thanh toán),
            // cần thêm 1 bước "reserve" atomic ở đây (tăng usedCount ngay khi tạo order,
            // hoàn lại nếu order bị hủy/hết hạn) - hỏi thêm nếu bạn muốn implement phần này.
        }

        long totalAmount = Math.max(0, built.subtotal + SHIPPING_FEE - discountAmount);
        String paymentMethodNormalized = requireText(paymentMethod, "paymentMethod không được để trống").toUpperCase();

        List<Map.Entry<String, Integer>> applied = new ArrayList<>();
        try {
            for (Map.Entry<String, Integer> entry : built.requiredQtyByVariant.entrySet()) {
                String[] parts = entry.getKey().split("__", 2);
                String productId = parts[0];
                String sku = parts[1];
                int qty = entry.getValue();

                if (!decrementStockAtomic(productId, sku, qty)) {
                    Product p = built.productCache.get(productId);
                    throw new RuntimeException("Số lượng tồn kho không đủ cho sản phẩm: "
                            + (p != null ? p.getName() : productId));
                }
                applied.add(entry);
            }
        } catch (RuntimeException ex) {
            rollbackStock(applied);
            throw ex;
        }

        Date now = new Date();

        List<OrderStatusLog> statusLogs = new ArrayList<>();
        statusLogs.add(OrderStatusLog.builder()
                .status("PENDING")
                .note("Đơn hàng vừa được tạo")
                .updatedBy(buyerId)
                .timestamp(now)
                .build());

        Payment payment = Payment.builder()
                .method(paymentMethodNormalized)
                .status("PENDING")
                .amount(totalAmount)
                .currency("VND")
                .transactionCode(null)
                .paidAt(null)
                .build();
        String initialStatus = "COD".equalsIgnoreCase(paymentMethodNormalized) ? "PROCESSING" : "PENDING";

        Order order = Order.builder()
                .buyerId(buyerId)
                .shopId(shopId)
                .orderCode(generateOrderCode())
                .shippingAddress(shippingAddress)
                .items(built.orderItems)
                .subtotal(built.subtotal)
                .shippingFee(SHIPPING_FEE)
                .discountAmount(discountAmount)
                .totalAmount(totalAmount)
                .orderStatus(initialStatus)
                .couponCode(coupon == null ? null : coupon.getCode())
                .note(note)
                .payment(payment)
                .statusLogs(statusLogs)
                .createdAt(now)
                .updatedAt(now)
                .build();

        try {
            return orderRepository.save(order);
        } catch (RuntimeException ex) {
            rollbackStock(applied);
            throw ex;
        }
    }

    private void rollbackStock(List<Map.Entry<String, Integer>> applied) {
        for (Map.Entry<String, Integer> done : applied) {
            String[] parts = done.getKey().split("__", 2);
            restoreStockAtomic(parts[0], parts[1], done.getValue());
        }
    }

    // ================== ĐỔI TRẠNG THÁI ORDER (đã đổi toàn bộ sang atomic) ==================

    @Override
    public List<Order> getOrdersByBuyer(String buyerId) {
        return orderRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId);
    }

    @Override
    public Page<Order> getOrdersByBuyer(String buyerId, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by("createdAt").descending());
        return orderRepository.findByBuyerId(buyerId, pageable);
    }

    @Override
    public List<Order> getOrdersByShop(String shopId) {
        return orderRepository.findByShopIdOrderByCreatedAtDesc(shopId);
    }

    @Override
    public Page<Order> getOrdersByShop(String shopId, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by("createdAt").descending());
        return orderRepository.findByShopId(shopId, pageable);
    }

    @Override
    public Order getOrderById(String orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy order"));
    }

    @Override
    public Order getOrderByCode(String orderCode) {
        return orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy order"));
    }

    /**
     * FIX #3: helper dùng chung cho mọi thao tác đổi trạng thái order.
     * Chỉ áp dụng update NẾU orderStatus hiện tại trong DB đúng bằng expectedCurrentStatus.
     * Trả về null nếu không khớp (nghĩa là 1 luồng khác đã thay đổi trạng thái trước đó) -
     * caller phải tự xử lý trường hợp null, KHÔNG được coi là thành công.
     */
    private Order atomicUpdateOrderStatus(String orderId, String expectedCurrentStatus, Update update) {
        Query query = Query.query(
                Criteria.where("_id").is(orderId).and("orderStatus").is(expectedCurrentStatus)
        );
        return mongoTemplate.findAndModify(query, update,
                FindAndModifyOptions.options().returnNew(true), Order.class);
    }

    @Override
    public Order updateOrderStatus(String orderId, String status, String updatedBy, String note) {
        Order current = getOrderById(orderId);
        String newStatus = requireText(status, "status không được để trống").toUpperCase();

        if (TERMINAL_STATUSES.contains(current.getOrderStatus())) {
            throw new RuntimeException("Đơn hàng đã ở trạng thái cuối (" + current.getOrderStatus()
                    + "), không thể cập nhật thêm");
        }

        Date now = new Date();
        Update update = new Update()
                .set("orderStatus", newStatus)
                .set("updatedAt", now)
                .push("statusLogs", OrderStatusLog.builder()
                        .status(newStatus).note(note).updatedBy(updatedBy).timestamp(now).build());

        if ("DELIVERED".equals(newStatus)) {
            update.set("deliveredAt", now);
        }

        Order result = atomicUpdateOrderStatus(orderId, current.getOrderStatus(), update);
        if (result == null) {
            throw new RuntimeException("Đơn hàng vừa bị thay đổi trạng thái bởi thao tác khác, vui lòng thử lại");
        }

        notificationService.notify(
                result.getBuyerId(),
                Notification.NotificationType.ORDER_STATUS,
                "Đơn hàng " + result.getOrderCode() + " cập nhật trạng thái",
                "Đơn hàng của bạn hiện đang ở trạng thái: " + newStatus,
                "/orders/" + result.getId()
        );

        return result;
    }

    @Override
    public Order startShipping(String orderId, String shippingProvider, String trackingCode, String note) {
        Order current = getOrderById(orderId);
        if (!"PROCESSING".equals(current.getOrderStatus())) {
            throw new RuntimeException("Chỉ đơn đang xử lý mới có thể bàn giao vận chuyển");
        }

        Date now = new Date();
        String provider = requireText(shippingProvider, "shippingProvider không được để trống").toUpperCase();
        String code = requireText(trackingCode, "trackingCode không được để trống").toUpperCase();

        Update update = new Update()
                .set("shippingProvider", provider)
                .set("trackingCode", code)
                .set("shippedAt", now)
                .set("orderStatus", "SHIPPING")
                .set("updatedAt", now)
                .push("statusLogs", OrderStatusLog.builder()
                        .status("SHIPPING")
                        .note(note == null || note.isBlank() ? "Đã bàn giao cho " + provider : note)
                        .updatedBy("SELLER")
                        .timestamp(now)
                        .build());

        Order result = atomicUpdateOrderStatus(orderId, "PROCESSING", update);
        if (result == null) {
            throw new RuntimeException("Đơn hàng vừa bị thay đổi trạng thái bởi thao tác khác, vui lòng thử lại");
        }

        notificationService.notify(
                result.getBuyerId(),
                Notification.NotificationType.ORDER_STATUS,
                "Đơn hàng " + result.getOrderCode() + " đang được giao",
                "Đơn hàng đã được bàn giao cho " + provider
                        + (code.isBlank() ? "" : ", mã vận đơn: " + code),
                "/orders/" + result.getId()
        );

        return result;
    }

    @Override
    public Order cancelOrder(String orderId, String canceledBy, String reason) {
        Order current = getOrderById(orderId);

        if (TERMINAL_STATUSES.contains(current.getOrderStatus())) {
            throw new RuntimeException("Không thể hủy đơn hàng ở trạng thái: " + current.getOrderStatus());
        }

        Date now = new Date();
        Update update = new Update()
                .set("orderStatus", "CANCELED")
                .set("canceledBy", canceledBy)
                .set("cancelReason", reason)
                .set("updatedAt", now)
                .push("statusLogs", OrderStatusLog.builder()
                        .status("CANCELED").note(reason).updatedBy(canceledBy).timestamp(now).build());

        // điều kiện: order phải VẪN ở đúng trạng thái đã đọc lúc đầu (không phải terminal)
        Order result = atomicUpdateOrderStatus(orderId, current.getOrderStatus(), update);
        if (result == null) {
            throw new RuntimeException("Đơn hàng vừa bị thay đổi trạng thái bởi thao tác khác, vui lòng thử lại");
        }

        if (result.getItems() != null) {
            for (OrderItem item : result.getItems()) {
                restoreStockAtomic(item.getProductId(), item.getVariantSku(), item.getQuantity());
            }
        }

        notificationService.notify(
                result.getBuyerId(),
                Notification.NotificationType.ORDER_STATUS,
                "Đơn hàng " + result.getOrderCode() + " đã bị hủy",
                reason == null || reason.isBlank() ? "Đơn hàng của bạn đã bị hủy" : reason,
                "/orders/" + result.getId()
        );

        return result;
    }

    @Override
    public Order markPaymentFailed(String orderCode, String reason) {
        Order current = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy order"));

        // Idempotent: nếu đã ở trạng thái cuối rồi thì không xử lý lại
        if (TERMINAL_STATUSES.contains(current.getOrderStatus())) {
            return current;
        }

        Date now = new Date();
        Update update = new Update()
                .set("payment.status", "FAILED")
                .set("orderStatus", "CANCELED")
                .set("cancelReason", reason)
                .set("updatedAt", now)
                .push("statusLogs", OrderStatusLog.builder()
                        .status("CANCELED").note(reason).updatedBy("VNPAY").timestamp(now).build());

        Order result = atomicUpdateOrderStatus(current.getId(), current.getOrderStatus(), update);
        if (result == null) {
            // đã bị luồng khác xử lý trước (vd: markPaymentSuccess vừa chạy xong) -> bỏ qua an toàn
            log.warn("markPaymentFailed bị bỏ qua vì order {} đã đổi trạng thái trước đó", orderCode);
            return orderRepository.findByOrderCode(orderCode).orElseThrow();
        }

        if (result.getItems() != null) {
            for (OrderItem item : result.getItems()) {
                restoreStockAtomic(item.getProductId(), item.getVariantSku(), item.getQuantity());
            }
        }

        notificationService.notify(
                result.getBuyerId(),
                Notification.NotificationType.ORDER_STATUS,
                "Thanh toán đơn hàng " + result.getOrderCode() + " thất bại",
                "Thanh toán không thành công, đơn hàng đã bị hủy tự động",
                "/orders/" + result.getId()
        );

        return result;
    }

    /**
     * Job hủy các đơn PENDING quá hạn. Đã đổi sang atomic findAndModify:
     * nếu 2 request/instance cùng cố hủy 1 order, chỉ 1 cái thành công (điều kiện
     * orderStatus="PENDING" chỉ khớp đúng 1 lần), tránh restoreStockAtomic bị gọi trùng.
     *
     * LƯU Ý: nếu bạn scale nhiều instance, job này vẫn nên bọc thêm ShedLock/Redis lock
     * để tránh N instance cùng quét N lần danh sách order hết hạn (tốn tài nguyên, dù
     * kết quả cuối vẫn đúng nhờ điều kiện atomic ở dưới).
     */
    @Override
    public int cancelExpiredPendingOrders(int minutesThreshold) {
        Date threshold = new Date(System.currentTimeMillis() - minutesThreshold * 60_000L);
        List<Order> expired = orderRepository.findByOrderStatusAndCreatedAtBefore("PENDING", threshold);

        int count = 0;
        for (Order order : expired) {
            try {
                Date now = new Date();
                Update update = new Update()
                        .set("orderStatus", "CANCELED")
                        .set("cancelReason", "Quá thời gian thanh toán")
                        .set("updatedAt", now)
                        .push("statusLogs", OrderStatusLog.builder()
                                .status("CANCELED")
                                .note("Tự động hủy do quá hạn thanh toán")
                                .updatedBy("SYSTEM")
                                .timestamp(now)
                                .build());

                Order result = atomicUpdateOrderStatus(order.getId(), "PENDING", update);
                if (result == null) {
                    // đã bị xử lý bởi request khác (vd: user vừa thanh toán xong) -> bỏ qua
                    continue;
                }

                if (result.getItems() != null) {
                    for (OrderItem item : result.getItems()) {
                        restoreStockAtomic(item.getProductId(), item.getVariantSku(), item.getQuantity());
                    }
                }

                notificationService.notify(
                        result.getBuyerId(),
                        Notification.NotificationType.ORDER_STATUS,
                        "Đơn hàng " + result.getOrderCode() + " đã bị hủy do quá hạn",
                        "Bạn chưa thanh toán trong thời gian quy định nên đơn hàng đã tự động bị hủy",
                        "/orders/" + result.getId()
                );

                count++;
            } catch (RuntimeException ex) {
                log.error("Lỗi hủy đơn quá hạn {}", order.getOrderCode(), ex);
            }
        }
        return count;
    }

    @Override
    public Order markPaymentSuccess(String orderCode, String transactionCode) {
        Order current = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy order"));

        Date now = new Date();
        Update update = new Update()
                .set("payment.status", "PAID")
                .set("payment.transactionCode", requireText(transactionCode, "transactionCode không được để trống"))
                .set("payment.paidAt", now)
                .set("orderStatus", "PROCESSING") // ✅ ĐÚNG: Chuyển sang PROCESSING (Người bán đang chuẩn bị hàng)
                .set("updatedAt", now)
                .push("statusLogs", OrderStatusLog.builder()
                        .status("PROCESSING")
                        .note("Thanh toán thành công qua VNPay, đơn hàng đang được người bán chuẩn bị")
                        .updatedBy("SYSTEM")
                        .timestamp(now)
                        .build());

        // FIX #1: chỉ áp dụng nếu order VẪN đang PENDING -> webhook gọi trùng lần 2 sẽ
        // không khớp điều kiện (order đã COMPLETED), findAndModify trả về null, không xử lý lại.
        Order result = atomicUpdateOrderStatus(current.getId(), "PENDING", update);

        if (result == null) {
            log.warn("markPaymentSuccess bị bỏ qua (webhook trùng hoặc order đã đổi trạng thái) orderCode={}",
                    orderCode);
            return orderRepository.findByOrderCode(orderCode).orElseThrow();
        }

        // FIX #2: chỉ cộng coupon usedCount khi findAndModify Ở TRÊN thành công
        // -> đảm bảo dù webhook gọi trùng bao nhiêu lần, usedCount chỉ tăng đúng 1 lần.
        if (result.getCouponCode() != null && !result.getCouponCode().isBlank()) {
            mongoTemplate.updateFirst(
                    Query.query(Criteria.where("code").is(result.getCouponCode())),
                    new Update().inc("usedCount", 1),
                    Coupon.class
            );
        }

        notificationService.notify(
                result.getBuyerId(),
                Notification.NotificationType.ORDER_STATUS,
                "Thanh toán đơn hàng " + result.getOrderCode() + " thành công",
                "Đơn hàng của bạn đã thanh toán thành công và đang được xử lý",
                "/orders/" + result.getId()
        );

        return result;
    }

    // ---- helpers ----

    private boolean decrementStockAtomic(String productId, String sku, int qty) {
        if (qty <= 0) {
            throw new IllegalArgumentException("qty phải > 0");
        }

        Query query = Query.query(
                Criteria.where("id").is(productId)
                        .and("status").is("ACTIVE")
                        .and("variants").elemMatch(
                                Criteria.where("sku").is(sku)
                                        .and("active").is(true)
                                        .and("stock").gte(qty)
                        )
        );

        Update update = new Update()
                .inc("variants.$.stock", -qty)
                .inc("soldCount", qty)
                .set("updatedAt", new Date());

        var result = mongoTemplate.updateFirst(query, update, Product.class);
        return result.getModifiedCount() == 1;
    }

    private void restoreStockAtomic(String productId, String sku, int qty) {
        Query query = Query.query(Criteria.where("id").is(productId)
                .and("variants.sku").is(sku));
        Update update = new Update()
                .inc("variants.$.stock", qty)
                .inc("soldCount", -qty);
        mongoTemplate.updateFirst(query, update, Product.class);
    }

    /**
     * FIX #7: dùng $pull atomic thay vì đọc toàn bộ cart.items rồi ghi đè cả mảng.
     * Chỉ "gỡ" đúng các item đã đặt hàng ra khỏi cart, không đụng tới item khác
     * có thể vừa được thêm song song từ thiết bị/tab khác.
     */
    private void removeItemsFromCart(String buyerId, Set<CartItemKey> keysToRemove) {
        for (CartItemKey key : keysToRemove) {
            Query query = Query.query(Criteria.where("userId").is(buyerId));
            Update update = new Update().pull("items",
                    Query.query(Criteria.where("productId").is(key.productId())
                            .and("variantSku").is(key.variantSku())).getQueryObject());
            mongoTemplate.updateFirst(query, update, Cart.class);
        }
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("userId").is(buyerId)),
                new Update().set("updatedAt", new Date()),
                Cart.class
        );
    }

    private ProductVariant findVariant(Product product, String sku) {
        if (product.getVariants() == null || product.getVariants().isEmpty()) {
            throw new RuntimeException("Product chưa có variant");
        }
        return product.getVariants().stream()
                .filter(item -> sku.equals(item.getSku()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy variant"));
    }

    private void validateCoupon(Coupon coupon, long subtotal) {
        Date now = new Date();
        if (!Boolean.TRUE.equals(coupon.getActive()))
            throw new RuntimeException("Coupon không còn hoạt động");
        if (coupon.getStartDate() != null && now.before(coupon.getStartDate()))
            throw new RuntimeException("Coupon chưa đến thời gian sử dụng");
        if (coupon.getEndDate() != null && now.after(coupon.getEndDate()))
            throw new RuntimeException("Coupon đã hết hạn");
        if (coupon.getUsageLimit() != null && coupon.getUsedCount() != null
                && coupon.getUsedCount() >= coupon.getUsageLimit())
            throw new RuntimeException("Coupon đã hết lượt sử dụng");
        long min = coupon.getMinOrderValue() == null ? 0L : coupon.getMinOrderValue();
        if (subtotal < min)
            throw new RuntimeException("Đơn hàng chưa đủ giá trị tối thiểu để áp coupon");
    }

    private long calculateDiscount(Coupon coupon, long subtotal) {
        long discount;
        if ("PERCENT".equalsIgnoreCase(coupon.getDiscountType())) {
            discount = subtotal * coupon.getDiscountValue() / 100;
            if (coupon.getMaxDiscountAmount() != null && discount > coupon.getMaxDiscountAmount()) {
                discount = coupon.getMaxDiscountAmount();
            }
        } else if ("FIXED".equalsIgnoreCase(coupon.getDiscountType())) {
            discount = coupon.getDiscountValue();
        } else {
            throw new RuntimeException("discountType không hợp lệ");
        }
        return discount;
    }

    private String generateOrderCode() {
        String randomSuffix = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return "ORD" + System.currentTimeMillis() + randomSuffix;
    }

    private String buildVariantKey(String productId, String sku) {
        return productId + "__" + sku;
    }

    private String requireText(String value, String message) {
        if (value == null || value.trim().isBlank()) throw new RuntimeException(message);
        return value.trim();
    }
}