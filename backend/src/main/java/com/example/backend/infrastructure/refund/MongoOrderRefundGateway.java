package com.example.backend.infrastructure.refund;

import com.example.backend.domain.refund.OrderRefundGateway;
import com.example.backend.module.Order;
import com.example.backend.module.Shop;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class MongoOrderRefundGateway implements OrderRefundGateway {

    private final MongoTemplate mongoTemplate;

    @Override
    public Optional<Order> lockForRefundRequest(String orderId) {
        Query lockQuery = Query.query(
                Criteria.where("_id").is(orderId)
                        .and("orderStatus").in("COMPLETED", "DELIVERED", "SHIPPING")
                        .and("hasPendingRefund").ne(true)
        );
        Update lockUpdate = new Update().set("hasPendingRefund", true);
        Order locked = mongoTemplate.findAndModify(lockQuery, lockUpdate,
                FindAndModifyOptions.options().returnNew(true), Order.class);
        return Optional.ofNullable(locked);
    }

    @Override
    public void unlockRefundFlag(String orderId) {
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(orderId)),
                new Update().set("hasPendingRefund", false),
                Order.class
        );
    }

    @Override
    public Optional<Order> markRefunded(String orderId) {
        Query orderQuery = Query.query(
                Criteria.where("_id").is(orderId)
                        .and("orderStatus").in("COMPLETED", "DELIVERED", "SHIPPING")
        );
        Update orderUpdate = new Update()
                .set("orderStatus", "REFUNDED")
                .set("updatedAt", new Date());
        Order updated = mongoTemplate.findAndModify(orderQuery, orderUpdate,
                FindAndModifyOptions.options().returnNew(true), Order.class);
        return Optional.ofNullable(updated);
    }

    @Override
    public void decrementShopSalesIfCounted(Order order) {
        if (Boolean.TRUE.equals(order.getSalesCounted()) && order.getShopId() != null) {
            mongoTemplate.updateFirst(
                    Query.query(Criteria.where("_id").is(order.getShopId()).and("totalSales").gt(0)),
                    new Update().inc("totalSales", -1),
                    Shop.class
            );
            mongoTemplate.updateFirst(
                    Query.query(Criteria.where("_id").is(order.getId())),
                    new Update().set("salesCounted", false),
                    Order.class
            );
        }
    }
}