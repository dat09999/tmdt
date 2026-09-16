package com.example.backend.service.impl;

import com.example.backend.DTO.shop.CreateShopCategoryRequest;
import com.example.backend.DTO.shop.ShopCategoryResponse;
import com.example.backend.Exception.ForbiddenException;
import com.example.backend.module.Product;
import com.example.backend.module.Shop;
import com.example.backend.module.ShopCategory;
import com.example.backend.repository.CategoryRepository;
import com.example.backend.repository.ProductRepository;
import com.example.backend.repository.ShopCategoryRepository;
import com.example.backend.repository.ShopRepository;
import com.example.backend.sercurity.SecurityUtils;
import com.example.backend.service.ShopCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShopCategoryServiceImpl implements ShopCategoryService {

    private final ShopCategoryRepository shopCategoryRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final MongoTemplate mongoTemplate;

    @Override
    public List<ShopCategoryResponse> getShopCategories(String shopId, boolean activeOnly) {
        List<ShopCategory> categories = activeOnly
                ? shopCategoryRepository.findByShopIdAndActiveTrueOrderBySortOrderAsc(shopId)
                : shopCategoryRepository.findByShopIdOrderBySortOrderAsc(shopId);

        return categories.stream()
                .map(cat -> toResponse(cat, productRepository.countByShopCategoryId(cat.getId())))
                .toList();
    }

    @Override
    public ShopCategoryResponse getShopCategoryById(String shopId, String categoryId) {
        ShopCategory category = shopCategoryRepository.findByIdAndShopId(categoryId, shopId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục của shop"));

        long productCount = productRepository.countByShopCategoryId(category.getId());
        return toResponse(category, productCount);
    }

    @Override
    public ShopCategoryResponse createShopCategory(String shopId, CreateShopCategoryRequest request) {
        verifyShopOwnership(shopId);

        String parentCatId = request.getParentCategoryId() != null && !request.getParentCategoryId().isBlank()
                ? request.getParentCategoryId().trim() : null;
        String parentCatName = request.getParentCategoryName() != null && !request.getParentCategoryName().isBlank()
                ? request.getParentCategoryName().trim() : null;

        if (parentCatId != null && (parentCatName == null || parentCatName.isBlank())) {
            parentCatName = categoryRepository.findById(parentCatId)
                    .map(com.example.backend.module.Category::getName)
                    .orElse(null);
        }

        ShopCategory category = ShopCategory.builder()
                .shopId(shopId)
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : "")
                .parentCategoryId(parentCatId)
                .parentCategoryName(parentCatName)
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .active(request.getActive() != null ? request.getActive() : true)
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();

        ShopCategory saved = shopCategoryRepository.save(category);
        return toResponse(saved, 0L);
    }

    @Override
    public ShopCategoryResponse updateShopCategory(String shopId, String categoryId, CreateShopCategoryRequest request) {
        verifyShopOwnership(shopId);

        ShopCategory category = shopCategoryRepository.findByIdAndShopId(categoryId, shopId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục của shop"));

        if (request.getName() != null && !request.getName().isBlank()) {
            category.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            category.setDescription(request.getDescription().trim());
        }
        if (request.getParentCategoryId() != null) {
            String pId = request.getParentCategoryId().trim();
            category.setParentCategoryId(pId.isEmpty() ? null : pId);
            if (!pId.isEmpty()) {
                String pName = request.getParentCategoryName() != null && !request.getParentCategoryName().isBlank()
                        ? request.getParentCategoryName().trim()
                        : categoryRepository.findById(pId).map(com.example.backend.module.Category::getName).orElse(null);
                category.setParentCategoryName(pName);
            } else {
                category.setParentCategoryName(null);
            }
        }
        if (request.getSortOrder() != null) {
            category.setSortOrder(request.getSortOrder());
        }
        if (request.getActive() != null) {
            category.setActive(request.getActive());
        }
        category.setUpdatedAt(new Date());

        ShopCategory updated = shopCategoryRepository.save(category);
        long productCount = productRepository.countByShopCategoryId(updated.getId());
        return toResponse(updated, productCount);
    }

    @Override
    public void deleteShopCategory(String shopId, String categoryId) {
        verifyShopOwnership(shopId);

        ShopCategory category = shopCategoryRepository.findByIdAndShopId(categoryId, shopId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục của shop"));

        // Xóa danh mục
        shopCategoryRepository.delete(category);

        // Gỡ bỏ liên kết shopCategoryId ở các sản phẩm thuộc danh mục này
        Query query = Query.query(Criteria.where("shopCategoryId").is(categoryId));
        Update update = new Update().unset("shopCategoryId");
        mongoTemplate.updateMulti(query, update, Product.class);
    }

    private void verifyShopOwnership(String shopId) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy shop"));

        boolean isAdmin = SecurityUtils.isAdmin();
        String currentUserId = null;
        try {
            currentUserId = SecurityUtils.getCurrentUserId();
        } catch (Exception ignored) {}

        boolean isOwner = currentUserId != null && currentUserId.equals(shop.getOwnerId());
        if (!isAdmin && !isOwner) {
            throw new ForbiddenException("Bạn không có quyền quản lý danh mục của shop này");
        }
    }

    private ShopCategoryResponse toResponse(ShopCategory category, long productCount) {
        return ShopCategoryResponse.builder()
                .id(category.getId())
                .shopId(category.getShopId())
                .name(category.getName())
                .description(category.getDescription())
                .parentCategoryId(category.getParentCategoryId())
                .parentCategoryName(category.getParentCategoryName())
                .sortOrder(category.getSortOrder())
                .active(category.getActive())
                .productCount(productCount)
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }
}
