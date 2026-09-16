package com.example.backend.infrastructure.refund;

import com.example.backend.domain.refund.StockGateway;
import com.example.backend.module.Product;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MongoStockGateway implements StockGateway {

    private final MongoTemplate mongoTemplate;

    @Override
    public void restore(String productId, String sku, int qty) {
        if (productId == null || sku == null || qty <= 0) return;
        Query query = Query.query(Criteria.where("id").is(productId)
                .and("variants.sku").is(sku));
        Update update = new Update()
                .inc("variants.$.stock", qty)
                .inc("soldCount", -qty);
        mongoTemplate.updateFirst(query, update, Product.class);
    }
}