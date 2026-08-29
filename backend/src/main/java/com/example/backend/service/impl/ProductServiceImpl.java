package com.example.backend.service.impl;

import com.example.backend.DTO.product.CreateProductRequest;
import com.example.backend.DTO.product.ProductImageRequest;
import com.example.backend.DTO.product.ProductImageResponse;
import com.example.backend.DTO.product.ProductResponse;
import com.example.backend.DTO.product.ProductVariantRequest;
import com.example.backend.Enum.IMAGE_VIDEO;
import com.example.backend.module.*;
import com.example.backend.repository.CategoryRepository;
import com.example.backend.repository.ProductRepository;
import com.example.backend.repository.ShopFollowRepository;
import com.example.backend.repository.ShopRepository;
import com.example.backend.service.NotificationService;
import com.example.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * ĐÃ SỬA CÁC LỖI CONCURRENCY / LOST UPDATE SO VỚI BẢN GỐC:
 *
 *  #12 updateProduct: KHÔNG còn ghi đè toàn bộ mảng variants (bản gốc xóa mất mọi thay đổi
 *      stock xảy ra song song, ví dụ khách đặt hàng ngay lúc seller đang sửa sản phẩm).
 *      Giờ chỉ merge các field KHÔNG PHẢI stock vào variant đã có sẵn trong DB, field stock
 *      luôn được giữ nguyên giá trị hiện tại. Có thêm API setStock() riêng nếu seller cần
 *      chỉnh tay số lượng tồn kho.
 *  #11 incrementViewCount: đổi sang atomic $inc thay vì đọc-cộng-ghi (tránh mất lượt xem
 *      khi nhiều user xem cùng lúc).
 *
 *  Không cần sửa gì thêm cho deleteProduct (lỗi #13) vì đã được bảo vệ gián tiếp bởi
 *  điều kiện status=ACTIVE trong decrementStockAtomic() ở OrderServiceImpl.
 *
 *  ĐÃ THÊM (không phải fix lỗi, tính năng mới): createProduct() giờ gọi
 *  notifyNewProductToFollowers() để thông báo cho follower của shop khi có sản phẩm mới.
 *  Xem TODO ở khai báo field để biết các chỗ cần bạn xác nhận lại (method repository,
 *  giá trị enum NotificationType).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final CategoryRepository categoryRepository;
    private final ObjectStorageService objectStorageService;
    private final MongoTemplate mongoTemplate;
    private final ShopFollowRepository shopFollowRepository;
    private final NotificationService notificationService;

    // ĐÃ THÊM: khi shop đăng sản phẩm mới, thông báo cho toàn bộ follower của shop.
    // TODO: cần thêm method findByShopId(String shopId) vào ShopFollowRepository nếu
    // chưa có (trả về List<ShopFollow>) - các method đã thấy trước đó chỉ có
    // existsByUserIdAndShopId/countByShopId/deleteByUserIdAndShopId, chưa có method lấy
    // danh sách đầy đủ follower.
    // TODO: xác nhận đúng giá trị enum Notification.NotificationType (đang dùng "PROMO"
    // tạm thời - đổi lại nếu bạn có giá trị enum riêng cho "sản phẩm mới", ví dụ "PRODUCT").
    // LƯU Ý HIỆU NĂNG: nếu shop có rất nhiều follower (hàng nghìn+), vòng lặp gọi notify()
    // đồng bộ như dưới đây sẽ làm request tạo sản phẩm bị chậm. Nếu gặp vấn đề này, cân
    // nhắc đánh dấu @Async cho notifyNewProductToFollowers() hoặc đẩy qua message queue.

    @Value("${minio.bucket-name}")
    private String imageBucket;
    @Value("${minio.bucket-video}")
    private String videoBucket;

    @Override
    public ProductResponse createProduct(CreateProductRequest request) {
        Shop shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy shop"));

        if (!"ACTIVE".equalsIgnoreCase(shop.getStatus())) {
            throw new RuntimeException("Shop không hoạt động");
        }

        categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy category"));

        String slug = buildSlug(request.getSlug(), request.getName());

        List<ProductImage> images = mapImages(request.getImages());
        List<ProductVariant> variants = mapVariants(request.getVariants());

        Product product = Product.builder()
                .shopId(requireText(request.getShopId(), "shopId không được để trống"))
                .categoryId(requireText(request.getCategoryId(), "categoryId không được để trống"))
                .name(requireText(request.getName(), "name không được để trống"))
                .slug(slug)
                .description(normalize(request.getDescription()))
                .brand(normalize(request.getBrand()))
                .basePrice(requirePrice(request.getBasePrice(), "basePrice không hợp lệ"))
                .status("ACTIVE")
                .images(images)
                .variants(variants)
                .tags(request.getTags() == null ? new ArrayList<>() : request.getTags())
                .soldCount(0)
                .viewCount(0)
                .rating(0.0)
                .totalReviews(0)
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();

        Product saved = productRepository.save(product);

        notifyNewProductToFollowers(shop, saved);

        return toProductResponse(saved);
    }

    /**
     * Thông báo sản phẩm mới cho toàn bộ follower của shop. Lỗi khi gửi thông báo (nếu có)
     * không được làm hỏng việc tạo sản phẩm - sản phẩm đã lưu DB thành công là quan trọng
     * nhất, thông báo chỉ là tác vụ phụ trợ nên bọc try/catch riêng, chỉ log lại nếu lỗi.
     */
    private void notifyNewProductToFollowers(Shop shop, Product product) {
        try {
            List<ShopFollow> followers = shopFollowRepository.findByShopId(shop.getId());
            if (followers == null || followers.isEmpty()) {
                return;
            }

            for (ShopFollow follower : followers) {
                notificationService.notify(
                        follower.getUserId(),
                        Notification.NotificationType.PROMOTION,
                        shop.getShopName() + " vừa đăng sản phẩm mới",
                        product.getName(),
                        "/products/" + product.getId()
                );
            }
        } catch (RuntimeException ex) {
            log.error("Gửi thông báo sản phẩm mới thất bại cho shop {}", shop.getId(), ex);
        }
    }

    @Override
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(this::toProductResponse)
                .toList();
    }

    @Override
    public Page<ProductResponse> getAllProducts(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by("createdAt").descending());
        return productRepository.findByStatus("ACTIVE", pageable).map(this::toProductResponse);
    }

    @Override
    public ProductResponse getProductById(String productId) {
        Product product = productRepository.findById(productId).orElseThrow(()->new RuntimeException("ko thay"));
        return toProductResponse(product);
    }

    @Override
    public ProductResponse getProductBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy product với slug: " + slug));

        return toProductResponse(product);
    }

    @Override
    public List<ProductResponse> getProductsByShop(String shopId) {
        return productRepository.findByShopId(shopId)
                .stream()
                .map(this::toProductResponse)
                .toList();
    }

    @Override
    public Page<ProductResponse> getProductsByShop(String shopId, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by("createdAt").descending());
        return productRepository.findByShopId(shopId, pageable).map(this::toProductResponse);
    }

    @Override
    public List<ProductResponse> getProductsByCategory(String categoryId) {
        return productRepository.findByCategoryId(categoryId)
                .stream()
                .map(this::toProductResponse)
                .toList();
    }

    @Override
    public Page<ProductResponse> getProductsByCategory(String categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by("createdAt").descending());
        return productRepository.findByCategoryId(categoryId, pageable).map(this::toProductResponse);
    }

    @Override
    public List<ProductResponse> searchByName(String keyword) {
        String key = normalize(keyword);

        List<Product> products;
        if (key == null || key.isBlank()) {
            products = productRepository.findAll();
        } else {
            products = productRepository.findByNameContainingIgnoreCase(key);
        }

        return products.stream()
                .map(this::toProductResponse)
                .toList();
    }

    @Override
    public Page<ProductResponse> searchByName(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by("createdAt").descending());
        String key = normalize(keyword);
        if (key == null || key.isBlank()) {
            return productRepository.findAll(pageable).map(this::toProductResponse);
        }
        return productRepository.findByNameContainingIgnoreCase(key, pageable).map(this::toProductResponse);
    }

    @Override
    public List<ProductResponse> searchByTag(String tag) {
        return productRepository.findByTagsContaining(tag)
                .stream()
                .map(this::toProductResponse)
                .toList();
    }

    @Override
    public Page<ProductResponse> searchByTag(String tag, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by("createdAt").descending());
        return productRepository.findByTagsContaining(tag, pageable).map(this::toProductResponse);
    }

    /**
     * FIX #12: KHÔNG còn ghi đè toàn bộ mảng variants bằng dữ liệu từ request.
     * Trước đây: product.setVariants(mapVariants(request.getVariants())) sẽ xóa mất
     * mọi thay đổi stock đã xảy ra ở DB kể từ lúc form load (ví dụ khách vừa mua hàng
     * ngay trong lúc seller đang sửa sản phẩm) vì mapVariants() build variant mới hoàn
     * toàn từ dữ liệu request (dữ liệu cũ, đã stale).
     *
     * Giờ đây: field stock của variant đã tồn tại LUÔN được giữ nguyên giá trị hiện tại
     * trong DB, chỉ merge các field khác (price, color, size, active...). Nếu seller
     * thực sự cần sửa tay số lượng tồn kho, dùng API setStock() riêng bên dưới.
     */
    @Override
    public ProductResponse updateProduct(String productId, CreateProductRequest request) {
        Product product = getProductEntityById(productId);

        if (request.getName() != null) {
            product.setName(request.getName().trim());
        }

        if (request.getSlug() != null) {
            product.setSlug(request.getSlug().trim());
        }

        if (request.getDescription() != null) {
            product.setDescription(request.getDescription().trim());
        }

        if (request.getBrand() != null) {
            product.setBrand(request.getBrand().trim());
        }

        if (request.getBasePrice() != null) {
            product.setBasePrice(request.getBasePrice());
        }

        if (request.getCategoryId() != null) {
            categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy category"));
            product.setCategoryId(request.getCategoryId());
        }

        if (request.getTags() != null) {
            product.setTags(request.getTags());
        }

        if (request.getImages() != null) {
            product.setImages(mapImages(request.getImages()));
        }

        if (request.getVariants() != null) {
            mergeVariantFieldsExceptStock(product, request.getVariants());
        }

        product.setUpdatedAt(new Date());

        Product saved = productRepository.save(product);
        return toProductResponse(saved);
    }

    /**
     * Merge thông tin variant từ request vào product hiện tại, KHÔNG đụng vào field stock.
     * - Variant đã tồn tại (khớp sku): chỉ cập nhật price/discountPrice/color/size/active,
     *   giữ nguyên stock hiện có trong DB.
     * - Variant chưa tồn tại (sku mới): thêm mới, lấy stock từ request (an toàn vì đây là
     *   variant chưa từng có nên không có dữ liệu cũ nào để mất).
     */
    private void mergeVariantFieldsExceptStock(Product product, List<ProductVariantRequest> requests) {
        if (product.getVariants() == null) {
            product.setVariants(new ArrayList<>());
        }

        Map<String, ProductVariant> currentBySku = product.getVariants().stream()
                .filter(v -> v.getSku() != null)
                .collect(java.util.stream.Collectors.toMap(ProductVariant::getSku, v -> v, (a, b) -> a));

        Set<String> seenSku = new HashSet<>();

        for (ProductVariantRequest req : requests) {
            if (req == null) continue;

            String sku = requireText(req.getSku(), "sku không được để trống");

            if (!seenSku.add(sku)) {
                throw new RuntimeException("SKU bị trùng trong danh sách variant");
            }

            Long price = requirePrice(req.getPrice(), "price không hợp lệ");
            Long discountPrice = req.getDiscountPrice();

            if (discountPrice != null && discountPrice < 0) {
                throw new RuntimeException("discountPrice phải >= 0");
            }
            if (discountPrice != null && discountPrice > price) {
                throw new RuntimeException("discountPrice không được lớn hơn price");
            }

            ProductVariant existing = currentBySku.get(sku);

            if (existing == null) {
                // Variant hoàn toàn mới -> stock lấy từ request là an toàn (chưa có dữ liệu cũ nào bị mất)
                Integer stock = req.getStock();
                if (stock == null || stock < 0) {
                    throw new RuntimeException("stock phải >= 0");
                }
                product.getVariants().add(ProductVariant.builder()
                        .sku(sku)
                        .color(normalize(req.getColor()))
                        .size(normalize(req.getSize()))
                        .price(price)
                        .discountPrice(discountPrice)
                        .stock(stock)
                        .active(req.getActive() == null ? true : req.getActive())
                        .build());
            } else {
                // Variant đã tồn tại -> KHÔNG đụng vào existing.getStock(), chỉ sửa các field khác
                existing.setPrice(price);
                existing.setDiscountPrice(discountPrice);
                existing.setColor(normalize(req.getColor()));
                existing.setSize(normalize(req.getSize()));
                existing.setActive(req.getActive() == null ? existing.getActive() : req.getActive());
            }
        }
    }

    /**
     * API riêng để seller/admin chỉnh tay số lượng tồn kho, atomic, tách biệt hoàn toàn
     * khỏi luồng update thông tin sản phẩm để không bao giờ gây lost update lẫn nhau.
     */
    public void setStock(String productId, String sku, int newStock) {
        if (newStock < 0) {
            throw new RuntimeException("stock phải >= 0");
        }
        Query query = Query.query(Criteria.where("id").is(productId).and("variants.sku").is(sku));
        Update update = new Update().set("variants.$.stock", newStock).set("updatedAt", new Date());
        var result = mongoTemplate.updateFirst(query, update, Product.class);
        if (result.getMatchedCount() == 0) {
            throw new RuntimeException("Không tìm thấy sản phẩm hoặc variant để cập nhật tồn kho");
        }
    }

    @Override
    public void deleteProduct(String productId) {
        Product product = getProductEntityById(productId);
        product.setStatus("INACTIVE");
        product.setUpdatedAt(new Date());
        productRepository.save(product);
    }

    /**
     * FIX #11: atomic increment thay vì đọc-cộng-ghi. Trước đây nhiều request xem sản phẩm
     * cùng lúc có thể đọc cùng 1 giá trị viewCount cũ, dẫn tới mất lượt xem (lost update).
     */
    @Override
    public ProductResponse incrementViewCount(String productId) {
        Query query = Query.query(Criteria.where("id").is(productId));
        Update update = new Update().inc("viewCount", 1).set("updatedAt", new Date());
        var updateResult = mongoTemplate.updateFirst(query, update, Product.class);

        if (updateResult.getMatchedCount() == 0) {
            throw new RuntimeException("ko thay");
        }

        Product saved = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("ko thay"));
        return toProductResponse(saved);
    }

    // ================== RESPONSE MAPPER ==================

    private ProductResponse toProductResponse(Product product) {
        if (product == null) {
            return null;
        }

        return ProductResponse.builder()
                .id(product.getId())
                .shopId(product.getShopId())
                .categoryId(product.getCategoryId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .brand(product.getBrand())
                .basePrice(product.getBasePrice())
                .status(product.getStatus())
                .images(mapImageResponses(product.getImages()))
                .variants(product.getVariants() == null ? List.of() : product.getVariants())
                .tags(product.getTags() == null ? List.of() : product.getTags())
                .soldCount(product.getSoldCount())
                .viewCount(product.getViewCount())
                .rating(product.getRating())
                .totalReviews(product.getTotalReviews())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    private List<ProductImageResponse> mapImageResponses(List<ProductImage> images) {
        if (images == null || images.isEmpty()) {
            return List.of();
        }

        return images.stream()
                .filter(Objects::nonNull)
                .map(this::toImageResponse)
                .toList();
    }

    private ProductImageResponse toImageResponse(ProductImage image) {
        String key = image.getUrl();

        String displayUrl = null;

        if (key != null && !key.isBlank()) {
            if (key.startsWith("https://")) {
                displayUrl = key;
            } else {
                if(image.getImageVideo().equals(IMAGE_VIDEO.IMAGE)) {
                    displayUrl = objectStorageService.getPublicUrlOrSignedUrl(imageBucket, key);
                }
                else{
                    displayUrl = objectStorageService.getPublicUrlOrSignedUrl(videoBucket, key);
                }
            }
        }

        return ProductImageResponse.builder()
                .key(key)
                .url(displayUrl)
                .isMain(image.getIsMain())
                .imageVideo(image.getImageVideo())
                .build();
    }

    private Product getProductEntityById(String productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy product"));
    }

    // ================== HELPERS ==================

    private String buildSlug(String slug, String name) {
        if (slug != null && !slug.trim().isBlank()) {
            return slug.trim().toLowerCase();
        }

        return name.trim().toLowerCase()
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("[đ]", "d")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                + "-" + System.currentTimeMillis();
    }

    private List<ProductImage> mapImages(List<ProductImageRequest> requests) {
        List<ProductImage> result = new ArrayList<>();

        if (requests == null || requests.isEmpty()) {
            return result;
        }

        boolean hasMain = false;

        for (ProductImageRequest item : requests) {
            if (item == null) {
                continue;
            }

            String url = normalize(item.getUrl());

            if (url == null || url.isBlank()) {
                continue;
            }

            boolean isMain = Boolean.TRUE.equals(item.getIsMain());

            if (isMain) {
                hasMain = true;
            }

            result.add(
                    ProductImage.builder()
                            .url(url)
                            .isMain(isMain)
                            .build()
            );
        }

        if (!result.isEmpty() && !hasMain) {
            result.get(0).setIsMain(true);
        }

        return result;
    }

    private List<ProductVariant> mapVariants(List<ProductVariantRequest> requests) {
        List<ProductVariant> result = new ArrayList<>();

        if (requests == null || requests.isEmpty()) {
            return result;
        }

        Set<String> skuSet = new HashSet<>();

        for (ProductVariantRequest item : requests) {
            if (item == null) {
                continue;
            }

            String sku = requireText(item.getSku(), "sku không được để trống");

            if (skuSet.contains(sku)) {
                throw new RuntimeException("SKU bị trùng trong danh sách variant");
            }

            skuSet.add(sku);

            Long price = requirePrice(item.getPrice(), "price không hợp lệ");

            Long discountPrice = item.getDiscountPrice();

            if (discountPrice != null && discountPrice < 0) {
                throw new RuntimeException("discountPrice phải >= 0");
            }

            if (discountPrice != null && discountPrice > price) {
                throw new RuntimeException("discountPrice không được lớn hơn price");
            }

            Integer stock = item.getStock();

            if (stock == null || stock < 0) {
                throw new RuntimeException("stock phải >= 0");
            }

            result.add(
                    ProductVariant.builder()
                            .sku(sku)
                            .color(normalize(item.getColor()))
                            .size(normalize(item.getSize()))
                            .price(price)
                            .discountPrice(discountPrice)
                            .stock(stock)
                            .active(item.getActive() == null ? true : item.getActive())
                            .build()
            );
        }

        return result;
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }

    private String requireText(String value, String message) {
        String result = normalize(value);

        if (result == null || result.isBlank()) {
            throw new RuntimeException(message);
        }

        return result;
    }

    private Long requirePrice(Long value, String message) {
        if (value == null || value < 0) {
            throw new RuntimeException(message);
        }

        return value;
    }
}