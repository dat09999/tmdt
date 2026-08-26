package com.example.backend.service.impl;

import com.example.backend.DTO.cart.AddToCartRequest;
import com.example.backend.module.Cart;
import com.example.backend.module.CartItem;
import com.example.backend.module.Product;
import com.example.backend.module.ProductImage;
import com.example.backend.module.ProductVariant;
import com.example.backend.repository.CartRepository;
import com.example.backend.repository.ProductRepository;
import com.example.backend.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * ĐÃ SỬA CÁC LỖI CONCURRENCY / LOST UPDATE SO VỚI BẢN GỐC:
 *
 *  #16 addToCart(): đọc toàn bộ cart.items, sửa trong bộ nhớ Java, rồi save() cả document -
 *      2 thiết bị/tab cùng thêm sản phẩm KHÁC NHAU vào cart gần như đồng thời sẽ bị mất 1
 *      trong 2 thao tác (ai save sau đè lên người trước). Fix: dùng findAndModify để atomic
 *      "tăng số lượng nếu item đã có" hoặc "thêm item mới nếu chưa có", không đọc-sửa-ghi
 *      toàn bộ mảng nữa.
 *
 *  #17 removeItem(): cùng pattern đọc-sửa-ghi. Fix: dùng $pull atomic (giống cách đã áp
 *      dụng cho OrderServiceImpl.removeItemsFromCart()).
 *
 *  #18 clearCart(): cùng pattern, save() cả document sau khi set items = []. Fix: atomic
 *      $set items = [] trực tiếp, không đọc cart trước.
 *
 *  LƯU Ý: việc check tồn kho (variant.getStock() < requestedQty) ở addToCart() vẫn chỉ là
 *  check "cho vui" để báo lỗi sớm - tồn kho THẬT SỰ được đảm bảo atomic ở bước checkout
 *  (decrementStockAtomic trong OrderServiceImpl). Giữ nguyên logic này, không phải bug.
 */
@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final MongoTemplate mongoTemplate;

    @Override
    public Cart addToCart(AddToCartRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy product"));

        if (!"ACTIVE".equalsIgnoreCase(product.getStatus())) {
            throw new RuntimeException("Product không hoạt động");
        }

        ProductVariant variant = findVariant(product, request.getVariantSku());

        if (!Boolean.TRUE.equals(variant.getActive())) {
            throw new RuntimeException("Variant không hoạt động");
        }

        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new RuntimeException("quantity phải >= 1");
        }

        // Check tồn kho sơ bộ cho UX (không phải nguồn đảm bảo an toàn duy nhất - xem ghi
        // chú ở đầu file). Dùng số lượng hiện có trong cart (nếu có) cộng thêm số mới yêu cầu.
        Cart existingCart = cartRepository.findByUserId(request.getUserId()).orElse(null);
        int currentQtyInCart = 0;
        if (existingCart != null && existingCart.getItems() != null) {
            currentQtyInCart = existingCart.getItems().stream()
                    .filter(item -> item.getProductId().equals(request.getProductId())
                            && item.getVariantSku().equals(request.getVariantSku()))
                    .mapToInt(CartItem::getQuantity)
                    .findFirst()
                    .orElse(0);
        }
        int requestedQty = request.getQuantity() + currentQtyInCart;

        if (variant.getStock() == null || variant.getStock() < requestedQty) {
            throw new RuntimeException("Số lượng tồn kho không đủ");
        }

        Long priceToUse = getSellingPrice(variant);
        String image = getMainImage(product);
        Date now = new Date();

        // FIX #16 - bước 1: thử tăng quantity ATOMIC nếu item (productId + variantSku)
        // đã có sẵn trong cart. elemMatch đảm bảo chỉ khớp đúng khi CÙNG userId VÀ
        // trong mảng items có phần tử khớp cả productId lẫn variantSku.
        Query matchExisting = Query.query(
                Criteria.where("userId").is(request.getUserId())
                        .and("items").elemMatch(
                                Criteria.where("productId").is(request.getProductId())
                                        .and("variantSku").is(request.getVariantSku())
                        )
        );
        Update incUpdate = new Update()
                .inc("items.$.quantity", request.getQuantity())
                .set("items.$.price", priceToUse)
                .set("items.$.image", image)
                .set("items.$.productName", product.getName())
                .set("items.$.shopId", product.getShopId())
                .set("updatedAt", now);

        Cart updated = mongoTemplate.findAndModify(matchExisting, incUpdate,
                FindAndModifyOptions.options().returnNew(true), Cart.class);

        if (updated != null) {
            return updated;
        }

        // Bước 2: item chưa có trong cart (hoặc cart chưa tồn tại) -> thêm mới atomic.
        // Điều kiện "items không chứa productId+variantSku này" để tránh 2 request cùng
        // lúc đều rơi vào nhánh push và tạo ra 2 phần tử trùng nhau trong mảng.
        // upsert(true) đảm bảo tự tạo document Cart mới nếu user chưa có cart.
        CartItem newItem = CartItem.builder()
                .productId(product.getId())
                .shopId(product.getShopId())
                .variantSku(variant.getSku())
                .productName(product.getName())
                .image(image)
                .price(priceToUse)
                .quantity(request.getQuantity())
                .build();

        Query pushCondition = Query.query(
                Criteria.where("userId").is(request.getUserId())
                        .andOperator(
                                new Criteria().orOperator(
                                        Criteria.where("items").exists(false),
                                        Criteria.where("items").not().elemMatch(
                                                Criteria.where("productId").is(request.getProductId())
                                                        .and("variantSku").is(request.getVariantSku())
                                        )
                                )
                        )
        );
        Update pushUpdate = new Update()
                .push("items", newItem)
                .set("updatedAt", now)
                .setOnInsert("userId", request.getUserId());

        Cart result = mongoTemplate.findAndModify(pushCondition, pushUpdate,
                FindAndModifyOptions.options().returnNew(true).upsert(true), Cart.class);

        if (result != null) {
            return result;
        }

        // Trường hợp cực hiếm: giữa bước 1 và bước 2, 1 request khác vừa kịp tạo item này
        // (race window rất hẹp) -> thử lại 1 lần bằng cách tăng quantity như bước 1.
        Cart retryUpdated = mongoTemplate.findAndModify(matchExisting, incUpdate,
                FindAndModifyOptions.options().returnNew(true), Cart.class);
        if (retryUpdated == null) {
            throw new RuntimeException("Không thể thêm sản phẩm vào giỏ hàng, vui lòng thử lại");
        }
        return retryUpdated;
    }

    @Override
    public Cart getCartByUserId(String userId) {
        return cartRepository.findByUserId(userId)
                .orElse(Cart.builder()
                        .userId(userId)
                        .items(List.of())
                        .updatedAt(new Date())
                        .build());
    }

    @Override
    public Cart removeItem(String userId, String productId, String variantSku) {
        // FIX #17: $pull atomic thay vì đọc-sửa-ghi toàn bộ mảng items.
        Query query = Query.query(Criteria.where("userId").is(userId));
        Update update = new Update()
                .pull("items", Query.query(
                        Criteria.where("productId").is(productId)
                                .and("variantSku").is(variantSku)
                ).getQueryObject())
                .set("updatedAt", new Date());

        Cart updated = mongoTemplate.findAndModify(query, update,
                FindAndModifyOptions.options().returnNew(true), Cart.class);

        if (updated == null) {
            throw new RuntimeException("Không tìm thấy giỏ hàng");
        }
        return updated;
    }

    @Override
    public void clearCart(String userId) {
        // FIX #18: atomic $set items = [] thay vì đọc cart rồi save() cả document.
        Query query = Query.query(Criteria.where("userId").is(userId));
        Update update = new Update().set("items", new ArrayList<>()).set("updatedAt", new Date());

        var result = mongoTemplate.updateFirst(query, update, Cart.class);
        if (result.getMatchedCount() == 0) {
            throw new RuntimeException("Không tìm thấy giỏ hàng");
        }
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

    private Long getSellingPrice(ProductVariant variant) {
        if (variant.getDiscountPrice() != null && variant.getDiscountPrice() > 0) {
            return variant.getDiscountPrice();
        }
        return variant.getPrice();
    }

    private String getMainImage(Product product) {
        if (product.getImages() == null || product.getImages().isEmpty()) {
            return null;
        }

        return product.getImages().stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsMain()))
                .map(ProductImage::getUrl)
                .findFirst()
                .orElse(product.getImages().get(0).getUrl());
    }
}