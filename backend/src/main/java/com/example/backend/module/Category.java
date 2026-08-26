package com.example.backend.module;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id 
    private String id;

    private String name;
    private String slug;            // URL-friendly, dùng cho SEO (vd: "dien-thoai-may-tinh-bang")
    private String description;
    private String image;           // ảnh đại diện danh mục
    private String parentId;        // null nếu là danh mục cha

    private Integer sortOrder;      // thứ tự hiển thị
    private Boolean active;
}
