package com.example.backend.service;

import com.example.backend.DTO.category.CreateCategoryRequest;
import com.example.backend.module.Category;

import java.util.List;

public interface CategoryService {
    Category createCategory(CreateCategoryRequest request);
    List<Category> getAllActiveCategories();
    Category getCategoryById(String categoryId);
    List<Category> getChildren(String parentId);
    Category updateCategory(String categoryId, CreateCategoryRequest request);
    void deleteCategory(String categoryId);
}
