package com.example.backend.service.impl;

import com.example.backend.DTO.wishlist.AddToWishlistRequest;
import com.example.backend.module.*;
import com.example.backend.repository.ProductRepository;
import com.example.backend.repository.WishlistRepository;
import com.example.backend.service.WishlistService;
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
 * ĐÃ SỬA CÁC LỖI CONCURRENCY / LOST UPDATE SO VỚI BẢN GỐC (cùng nhóm lỗi đã sửa ở
 * CartServiceImpl #16/#17/#18, chỉ khác là xảy ra trên Wishlist.items thay vì Cart.items):
 *
 *  #29 addToWishlist(): đọc toàn bộ wishlist.items, check trùng + thêm trong bộ nhớ Java,
 *      rồi save() cả document - 2 thiết bị cùng thêm 2 sản phẩm KHÁC NHAU vào wishlist gần
 *      như đồng thời sẽ mất 1 trong 2. Fix: dùng findAndModify với điều kiện "items chưa
 *      chứa productId này", $push atomic, upsert=true để tự tạo wishlist nếu user chưa có.
 *      Nếu điều kiện không khớp (nghĩa là sản phẩm đã có sẵn trong wishlist), coi như
 *      thao tác idempotent - trả về wishlist hiện tại, không báo lỗi.
 *
 *  #30 removeFromWishlist(): cùng pattern đọc-sửa-ghi. Fix: $pull atomic.
 *
 *  #31 clearWishlist(): cùng pattern, save() cả document sau khi set items = []. Fix:
 *      atomic $set items = [] trực tiếp.
 */
@Service
@RequiredArgsConstructor
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final MongoTemplate mongoTemplate;

    @Override
    public Wishlist addToWishlist(AddToWishlistRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy product"));

        String mainImage = product.getImages() == null ? null : product.getImages().stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsMain()))
                .map(ProductImage::getUrl)
                .findFirst()
                .orElse(product.getImages().isEmpty() ? null : product.getImages().get(0).getUrl());

        WishlistItem newItem = WishlistItem.builder()
                .productId(product.getId())
                .productName(product.getName())
                .image(mainImage)
                .price(product.getBasePrice())
                .shopId(product.getShopId())
                .addedAt(new Date())
                .build();

        Date now = new Date();

        // FIX #29: atomic push CHỈ KHI wishlist chưa chứa productId này (hoặc wishlist
        // chưa tồn tại). upsert=true tự tạo document Wishlist mới nếu user chưa có.
        Query pushCondition = Query.query(
                Criteria.where("userId").is(request.getUserId())
                        .andOperator(
                                new Criteria().orOperator(
                                        Criteria.where("items").exists(false),
                                        Criteria.where("items").not().elemMatch(
                                                Criteria.where("productId").is(request.getProductId())
                                        )
                                )
                        )
        );
        Update pushUpdate = new Update()
                .push("items", newItem)
                .set("updatedAt", now)
                .setOnInsert("userId", request.getUserId());

        Wishlist result = mongoTemplate.findAndModify(pushCondition, pushUpdate,
                FindAndModifyOptions.options().returnNew(true).upsert(true), Wishlist.class);

        if (result != null) {
            return result;
        }

        // Điều kiện không khớp -> sản phẩm đã có sẵn trong wishlist (idempotent, không lỗi)
        return wishlistRepository.findByUserId(request.getUserId())
                .orElseGet(() -> Wishlist.builder()
                        .userId(request.getUserId())
                        .items(new ArrayList<>())
                        .updatedAt(now)
                        .build());
    }

    @Override
    public Wishlist getWishlistByUserId(String userId) {
        return wishlistRepository.findByUserId(userId)
                .orElse(Wishlist.builder().userId(userId).items(List.of()).build());
    }

    @Override
    public Wishlist removeFromWishlist(String userId, String productId) {
        // FIX #30: $pull atomic thay vì đọc-sửa-ghi toàn bộ mảng items.
        Query query = Query.query(Criteria.where("userId").is(userId));
        Update update = new Update()
                .pull("items", Query.query(Criteria.where("productId").is(productId)).getQueryObject())
                .set("updatedAt", new Date());

        Wishlist updated = mongoTemplate.findAndModify(query, update,
                FindAndModifyOptions.options().returnNew(true), Wishlist.class);

        if (updated == null) {
            throw new RuntimeException("Không tìm thấy wishlist");
        }
        return updated;
    }

    @Override
    public void clearWishlist(String userId) {
        // FIX #31: atomic $set items = [] thay vì đọc wishlist rồi save() cả document.
        Query query = Query.query(Criteria.where("userId").is(userId));
        Update update = new Update().set("items", new ArrayList<>()).set("updatedAt", new Date());
        mongoTemplate.updateFirst(query, update, Wishlist.class);
    }

    @Override
    public boolean isWish(String userId, String productID) {
        Wishlist a = wishlistRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("ko co"));
        List<WishlistItem> b = a.getItems();
        List<String> c = b.stream().map(WishlistItem::getProductId).toList();
        return c.contains(productID);
    }
}