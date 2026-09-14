package com.example.backend.DTO.common;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.List;

/**
 * Lớp bọc PageImpl hỗ trợ Jackson serialize/deserialize tương thích 100% với Redis Cache.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class RestPage<T> extends PageImpl<T> {

    @JsonCreator(mode = JsonCreator.Mode.PROPERTIES)
    public RestPage(@JsonProperty("content") List<T> content,
                    @JsonProperty("number") int number,
                    @JsonProperty("size") int size,
                    @JsonProperty("totalElements") long totalElements) {
        super(content == null ? new ArrayList<>() : content,
              PageRequest.of(Math.max(0, number), Math.max(1, size)),
              totalElements);
    }

    public RestPage(Page<T> page) {
        super(page.getContent(), page.getPageable(), page.getTotalElements());
    }

    public RestPage(List<T> content, Pageable pageable, long total) {
        super(content, pageable, total);
    }

    public RestPage(List<T> content) {
        super(content);
    }

    public RestPage() {
        super(new ArrayList<>());
    }
}
