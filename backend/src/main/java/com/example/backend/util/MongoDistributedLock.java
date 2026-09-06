package com.example.backend.util;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
@RequiredArgsConstructor
@Slf4j
public class MongoDistributedLock {

    private final MongoTemplate mongoTemplate;
    private static final String LOCK_COLLECTION = "distributed_locks";

    /**
     * Cố gắng chiếm lock nguyên tử trong MongoDB để bảo vệ scheduler / job.
     * @param lockKey Tên định danh lock
     * @param durationMs Thời hạn giữ lock tính bằng mili-giây
     * @return true nếu lấy được lock thành công, false nếu đã có instance khác đang giữ
     */
    public boolean acquireLock(String lockKey, long durationMs) {
        Date now = new Date();
        Date expiresAt = new Date(now.getTime() + durationMs);

        Query query = new Query(
                Criteria.where("_id").is(lockKey)
                        .orOperator(
                                Criteria.where("expiresAt").lt(now),
                                Criteria.where("expiresAt").exists(false)
                        )
        );

        Update update = new Update()
                .set("_id", lockKey)
                .set("lockedAt", now)
                .set("expiresAt", expiresAt);

        try {
            Document result = mongoTemplate.findAndModify(
                    query,
                    update,
                    FindAndModifyOptions.options().upsert(true).returnNew(true),
                    Document.class,
                    LOCK_COLLECTION
            );
            return result != null;
        } catch (org.springframework.dao.DuplicateKeyException e) {
            return false;
        } catch (Exception e) {
            log.warn("Không thể lấy distributed lock {}: {}", lockKey, e.getMessage());
            return false;
        }
    }

    /**
     * Giải phóng lock sau khi chạy xong job.
     */
    public void releaseLock(String lockKey) {
        try {
            Query query = Query.query(Criteria.where("_id").is(lockKey));
            Update update = new Update().set("expiresAt", new Date(0));
            mongoTemplate.updateFirst(query, update, LOCK_COLLECTION);
        } catch (Exception e) {
            log.warn("Lỗi khi giải phóng lock {}: {}", lockKey, e.getMessage());
        }
    }
}
