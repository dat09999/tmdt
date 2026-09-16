package com.example.backend.infrastructure.refund;

import com.example.backend.domain.refund.RefundRequestGateway;
import com.example.backend.module.RefundRequest;
import com.example.backend.repository.RefundRequestRepository;
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
public class MongoRefundRequestGateway implements RefundRequestGateway {

    private final RefundRequestRepository refundRequestRepository;
    private final MongoTemplate mongoTemplate;

    @Override
    public RefundRequest save(RefundRequest refund) {
        return refundRequestRepository.save(refund);
    }

    @Override
    public Optional<RefundRequest> markProcessed(String refundId, String newStatus, String adminNote, String resolvedBy) {
        Date now = new Date();
        Query refundQuery = Query.query(
                Criteria.where("_id").is(refundId).and("status").is("PENDING")
        );
        Update refundUpdate = new Update()
                .set("status", newStatus)
                .set("adminNote", adminNote)
                .set("resolvedBy", resolvedBy)
                .set("resolvedAt", now)
                .set("updatedAt", now);

        RefundRequest refund = mongoTemplate.findAndModify(refundQuery, refundUpdate,
                FindAndModifyOptions.options().returnNew(true), RefundRequest.class);
        return Optional.ofNullable(refund);
    }
}