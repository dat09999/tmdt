package com.example.backend.service.impl;

import com.example.backend.DTO.category.CreateCategoryRequest;
import com.example.backend.module.Category;
import com.example.backend.repository.CategoryRepository;
import com.example.backend.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * ĐÃ SỬA (mức độ phòng ngừa, không phải lỗi nghiêm trọng):
 *
 *  #25 updateCategory(), deleteCategory(): đổi từ đọc-sửa-ghi cả document sang atomic $set
 *      chỉ trên field cần đổi, cho nhất quán với các service khác trong hệ thống. Rủi ro
 *      thực tế của lỗi này THẤP hơn nhiều so với các file Order/Product/Coupon đã sửa
 *      trước đó, vì Category là dữ liệu admin quản lý (tần suất sửa đồng thời rất thấp) và
 *      hiện chưa có chỗ nào khác trong code atomic-update riêng lẻ trên field của Category.
 *      Sửa chủ yếu để phòng ngừa nếu sau này có tính năng mới (vd: đếm số sản phẩm theo
 *      category) atomic-update vào cùng document này.
 *
 *  createCategory(): KHÔNG có lỗi concurrency - hàm này không có logic check trùng
 *      name/slug trước khi tạo nên không mắc TOCTOU. Nếu bạn muốn name/slug là duy nhất,
 *      đây là tính năng cần bổ sung riêng (thêm unique index + check), không phải bug có
 *      sẵn trong code hiện tại.
 */
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final MongoTemplate mongoTemplate;

    @Override
    public Category createCategory(CreateCategoryRequest request) {
        String parentId = normalize(request.getParentId());
        if (parentId != null && !parentId.isBlank()) {
            categoryRepository.findById(parentId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy category cha"));
        }

        Category category = Category.builder()
                .name(requireText(request.getName(), "name không được để trống"))
                .slug(normalize(request.getSlug()))
                .description(normalize(request.getDescription()))
                .image(normalize(request.getImage()))
                .parentId(parentId)
                .sortOrder(request.getSortOrder())
                .active(true)
                .build();

        return categoryRepository.save(category);
    }

    @Override
    public List<Category> getAllActiveCategories() {
        return categoryRepository.findByActiveTrue();
    }

    @Override
    public Category getCategoryById(String categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy category"));
    }

    @Override
    public List<Category> getChildren(String parentId) {
        return categoryRepository.findByParentId(parentId);
    }

    /** FIX #25: chỉ atomic $set các field request có gửi lên, không ghi đè cả document. */
    @Override
    public Category updateCategory(String categoryId, CreateCategoryRequest request) {
        getCategoryById(categoryId); // vẫn giữ để báo 404 sớm nếu categoryId không tồn tại

        Update update = new Update();
        boolean hasChange = false;

        if (request.getName() != null) {
            update.set("name", request.getName().trim());
            hasChange = true;
        }
        if (request.getSlug() != null) {
            update.set("slug", request.getSlug().trim());
            hasChange = true;
        }
        if (request.getDescription() != null) {
            update.set("description", request.getDescription().trim());
            hasChange = true;
        }
        if (request.getImage() != null) {
            update.set("image", request.getImage().trim());
            hasChange = true;
        }
        if (request.getSortOrder() != null) {
            update.set("sortOrder", request.getSortOrder());
            hasChange = true;
        }

        if (!hasChange) {
            return getCategoryById(categoryId);
        }

        return atomicUpdateCategory(categoryId, update);
    }

    /** FIX #25: atomic $set field "active", không ghi đè cả document. */
    @Override
    public void deleteCategory(String categoryId) {
        getCategoryById(categoryId);
        Update update = new Update().set("active", false);
        atomicUpdateCategory(categoryId, update);
    }

    private Category atomicUpdateCategory(String categoryId, Update update) {
        Query query = Query.query(Criteria.where("_id").is(categoryId));
        Category updated = mongoTemplate.findAndModify(query, update,
                FindAndModifyOptions.options().returnNew(true), Category.class);
        if (updated == null) {
            throw new RuntimeException("Không tìm thấy category");
        }
        return updated;
    }

    private String normalize(String value) { return value == null ? null : value.trim(); }

    private String requireText(String value, String message) {
        String result = normalize(value);
        if (result == null || result.isBlank()) throw new RuntimeException(message);
        return result;
    }
}