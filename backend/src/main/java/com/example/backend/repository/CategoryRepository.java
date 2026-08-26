package com.example.backend.repository;

import com.example.backend.module.Category;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CategoryRepository extends MongoRepository<Category, String> {
    List<Category> findByActiveTrue();
    List<Category> findByParentId(String parentId);
}