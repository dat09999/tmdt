package com.example.backend.DTO.common;

import com.example.backend.DTO.product.ProductResponse;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.serializer.RedisSerializer;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RestPageTest {

    @Test
    void testRedisSerializationAndDeserialization() {
        ProductResponse p = ProductResponse.builder()
                .id("prod-1")
                .name("Ao thun")
                .basePrice(100L)
                .build();

        RestPage<ProductResponse> original = new RestPage<>(List.of(p), PageRequest.of(0, 12), 1L);

        RedisSerializer<Object> serializer = RedisSerializer.json();
        byte[] bytes = serializer.serialize(original);
        assertNotNull(bytes);

        Object deserialized = serializer.deserialize(bytes);
        assertNotNull(deserialized);
        assertTrue(deserialized instanceof RestPage<?>);

        RestPage<?> page = (RestPage<?>) deserialized;
        assertEquals(1, page.getContent().size());
        assertEquals(1L, page.getTotalElements());
        assertEquals(0, page.getNumber());
        assertEquals(12, page.getSize());
    }
}
