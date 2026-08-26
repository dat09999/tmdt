package com.example.backend.service.impl;

import com.example.backend.DTO.refund.CreateRefundRequest;
import com.example.backend.module.Order;
import com.example.backend.module.RefundRequest;
import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.RefundRequestRepository;
import com.example.backend.service.RefundRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

/**
 * ĐÃ SỬA CÁC LỖI CONCURRENCY / LOST UPDATE SO VỚI BẢN GỐC:
 *
 *  #A createRefundRequest(): check "đã có refund đang xử lý chưa" (exists) rồi mới insert
 *      là pattern TOCTOU (Time-Of-Check-to-Time-Of-Use) - giống lỗi #8 đã gặp ở coupon.
 *      2 request tạo refund cho cùng 1 order gần như đồng thời có thể CÙNG đọc "chưa có
 *      refund nào" -> cả 2 cùng insert thành công -> 1 order có 2 refund request PENDING.
 *      Fix: dùng findAndModify trên chính document Order để "khóa" atomic bằng field
 *      hasPendingRefund, chỉ cho phép 1 request tạo refund thành công tại 1 thời điểm.
 *
 *  #B processRefund(): đọc-sửa-ghi tự do trên RefundRequest, không kiểm tra trạng thái
 *      hiện tại trước khi ghi. Nếu admin bấm duyệt refund 2 lần liên tiếp (double-click,
 *      hoặc 2 tab), cả 2 request đều xử lý được -> order có thể bị set REFUNDED 2 lần,
 *      hoặc 1 refund đã bị REJECTED có thể bị ghi đè thành APPROVED sau đó bởi request
 *      cũ vẫn đang chạy song song.
 *      Fix: dùng findAndModify với điều kiện status="PENDING" hiện tại, chỉ cho phép xử
 *      lý đúng 1 lần. Đồng thời update Order cũng chuyển sang atomic có điều kiện, thay vì
 *      đọc-sửa-ghi trực tiếp.
 *
 *  LƯU Ý QUAN TRỌNG: cách fix #A dùng field mới "hasPendingRefund" trên Order - bạn cần
 *  thêm field này vào model Order (Boolean, mặc định null/false). Đây là field kỹ thuật
 *  dùng để khóa, không hiển thị cho người dùng.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class RefundRequestServiceImpl implements RefundRequestService {

    private final RefundRequestRepository refundRequestRepository;
    private final OrderRepository orderRepository;
    private final MongoTemplate mongoTemplate;

    @Override
    public RefundRequest createRefundRequest(CreateRefundRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        if (!request.getUserId().equals(order.getBuyerId())) {
            throw new RuntimeException("Bạn không có quyền yêu cầu hoàn tiền cho đơn hàng này");
        }

        // FIX #A: thay vì đọc danh sách refund rồi check "exists" (TOCTOU), dùng findAndModify
        // để atomic vừa CHECK vừa KHÓA ngay trong 1 lệnh DB. Điều kiện:
        //  - order đang ở COMPLETED hoặc SHIPPING
        //  - order CHƯA có refund nào đang chờ xử lý (hasPendingRefund != true)
        // Nếu 2 request chạy đồng thời, chỉ 1 request khớp điều kiện và khóa thành công,
        // request còn lại sẽ nhận về null ngay lập tức.
        Query lockQuery = Query.query(
                Criteria.where("_id").is(order.getId())
                        .and("orderStatus").in("COMPLETED", "SHIPPING")
                        .and("hasPendingRefund").ne(true)
        );
        Update lockUpdate = new Update().set("hasPendingRefund", true);

        Order locked = mongoTemplate.findAndModify(lockQuery, lockUpdate,
                FindAndModifyOptions.options().returnNew(true), Order.class);

        if (locked == null) {
            // Không khóa được -> hoặc order sai trạng thái, hoặc đã có refund khác đang xử lý.
            // Phân biệt rõ để báo lỗi đúng cho người dùng.
            if (!"COMPLETED".equalsIgnoreCase(order.getOrderStatus())
                    && !"SHIPPING".equalsIgnoreCase(order.getOrderStatus())) {
                throw new RuntimeException("Chỉ có thể yêu cầu hoàn trả khi đơn hàng đang giao hoặc đã hoàn thành");
            }
            throw new RuntimeException("Đơn hàng này đã có yêu cầu hoàn trả đang xử lý");
        }

        Date now = new Date();
        RefundRequest refund;
        try {
            refund = RefundRequest.builder()
                    .orderId(request.getOrderId())
                    .userId(request.getUserId())
                    .shopId(order.getShopId())
                    .reason(request.getReason())
                    .type(request.getType() == null ? "REFUND" : request.getType().toUpperCase())
                    .status("PENDING")
                    .images(request.getImages())
                    .refundAmount(order.getTotalAmount())
                    .createdAt(now)
                    .updatedAt(now)
                    .build();

            return refundRequestRepository.save(refund);
        } catch (RuntimeException ex) {
            // Nếu insert refund lỗi vì lý do khác (validation, DB down...), phải MỞ KHÓA lại
            // order, nếu không order sẽ bị kẹt "hasPendingRefund=true" mãi mãi dù chưa có
            // refund request nào thực sự tồn tại.
            mongoTemplate.updateFirst(
                    Query.query(Criteria.where("_id").is(order.getId())),
                    new Update().set("hasPendingRefund", false),
                    Order.class
            );
            throw ex;
        }
    }

    @Override
    public List<RefundRequest> getRefundsByUser(String userId) {
        return refundRequestRepository.findByUserId(userId);
    }

    @Override
    public List<RefundRequest> getRefundsByShop(String shopId) {
        return refundRequestRepository.findByShopId(shopId);
    }

    @Override
    public RefundRequest getRefundById(String refundId) {
        return refundRequestRepository.findById(refundId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu hoàn trả"));
    }

    @Override
    public RefundRequest processRefund(String refundId, String status, String adminNote, String resolvedBy) {
        String newStatus = status.toUpperCase();
        Date now = new Date();

        // FIX #B: chỉ cho phép xử lý nếu refund hiện tại VẪN đang ở PENDING.
        // Nếu admin bấm duyệt 2 lần (double-click, 2 tab), lần thứ 2 sẽ không khớp điều
        // kiện (status đã đổi khỏi PENDING ở lần đầu) -> tự động bị chặn, trả về null.
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

        if (refund == null) {
            throw new RuntimeException("Yêu cầu hoàn trả này đã được xử lý trước đó, vui lòng tải lại trang");
        }

        if ("APPROVED".equalsIgnoreCase(newStatus)) {
            // Update order atomic có điều kiện, thay vì đọc-sửa-ghi tự do như bản gốc.
            // Điều kiện orderStatus phải đang COMPLETED/SHIPPING - tránh trường hợp order
            // đã bị thay đổi trạng thái bởi luồng khác (vd: cancel) ngay trước đó.
            Query orderQuery = Query.query(
                    Criteria.where("_id").is(refund.getOrderId())
                            .and("orderStatus").in("COMPLETED", "SHIPPING")
            );
            Update orderUpdate = new Update()
                    .set("orderStatus", "REFUNDED")
                    .set("updatedAt", now);

            Order updatedOrder = mongoTemplate.findAndModify(orderQuery, orderUpdate,
                    FindAndModifyOptions.options().returnNew(true), Order.class);

            if (updatedOrder == null) {
                log.warn("Duyệt refund {} thành công nhưng order {} không còn ở trạng thái phù hợp để chuyển REFUNDED - cần kiểm tra thủ công",
                        refundId, refund.getOrderId());
            }
        } else if ("REJECTED".equalsIgnoreCase(newStatus)) {
            // Refund bị từ chối -> mở khóa "hasPendingRefund" trên order để user có thể
            // tạo yêu cầu hoàn trả MỚI sau này nếu cần (đây chính là phần mà lock ở FIX #A
            // cần được giải phóng đúng lúc, nếu không order sẽ bị kẹt vĩnh viễn).
            mongoTemplate.updateFirst(
                    Query.query(Criteria.where("_id").is(refund.getOrderId())),
                    new Update().set("hasPendingRefund", false),
                    Order.class
            );
        }

        return refund;
    }
}