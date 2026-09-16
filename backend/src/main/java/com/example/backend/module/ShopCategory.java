package com.example.backend.module;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

/**
 * Danh mục riêng do từng chủ Shop tự tạo để phân loại sản phẩm trong gian hàng của mình.
 * Độc lập với Cây danh mục toàn sàn của Admin.
 */
@Document(collection = "shop_categories")
@CompoundIndex(name = "shop_cat_sort_idx", def = "{'shopId': 1, 'sortOrder': 1}")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopCategory {

    @Id
    private String id;

    @Indexed
    private String shopId;

    private String name;

    private String description;

    /**
     * ID nhánh hoặc danh mục chính của sàn mà danh mục này trực thuộc.
     */
    private String parentCategoryId;

    /**
     * Tên nhánh hoặc danh mục sàn để frontend tiện hiển thị.
     */
    private String parentCategoryName;

    @Builder.Default
    private Integer sortOrder = 0;

    @Builder.Default
    private Boolean active = true;

    private Date createdAt;

    private Date updatedAt;
}
