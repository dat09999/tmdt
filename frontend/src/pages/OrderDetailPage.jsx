import { useEffect, useState } from "react";
import { API_BASE_URL, authFetch } from "../utils/auth";
import { useAuth } from "./Authcontext";
import Header from "../components/Header";
import "./OrderDetailPage.css";

// Chỉ đơn ở trạng thái này mới được đánh giá.
// Đổi thành "COMPLETED" ở đây nếu backend của bạn dùng đúng chuỗi đó
// thay vì "DELIVERED".
const REVIEWABLE_STATUS = "COMPLETED";

export default function OrderDetailPage() {
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [openReviewKey, setOpenReviewKey] = useState(null);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [submittedKeys, setSubmittedKeys] = useState(new Set());
  const [submittingKey, setSubmittingKey] = useState(null);

  useEffect(() => {
    if (!user?.userId) {
      window.location.href = "/login";
      return;
    }
    const orderId = window.location.pathname.split("/")[2];
    fetchOrder(orderId);
  }, []);

  const fetchOrder = async (orderId) => {
    try {
      setLoading(true);
      const data = await authFetch(`${API_BASE_URL}/orders/${orderId}`);
      setOrder(data);
    } catch (err) {
      setMessage(err.message || "Không tải được chi tiết đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.location.href = "/orders";
  };

  const itemKey = (item) => `${item.productId}-${item.variantSku || ""}`;

  const getDraft = (key) => reviewDrafts[key] || { rating: 5, comment: "" };

  const setDraft = (key, patch) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [key]: { ...getDraft(key), ...patch },
    }));
  };

  const handleSubmitReview = async (item) => {
    const key = itemKey(item);
    const draft = getDraft(key);

    try {
      setSubmittingKey(key);
      await authFetch(`${API_BASE_URL}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          productId: item.productId,
          orderId: order.id || order._id,
          variantSku: item.variantSku,
          rating: draft.rating,
          comment: draft.comment,
        }),
      });

      setSubmittedKeys((prev) => new Set(prev).add(key));
      setOpenReviewKey(null);
      setMessage("Đã gửi đánh giá, cảm ơn bạn!");
    } catch (err) {
      setMessage(err.message || "Không gửi được đánh giá.");
    } finally {
      setSubmittingKey(null);
    }
  };

  const canReview = order?.orderStatus === REVIEWABLE_STATUS;
  

  return (
    <div className="order-detail-page">
      <Header />
      <header className="order-detail-header">
        <div>
          <h1>Chi tiết đơn hàng</h1>
          <p>{user?.email || "Khách"}</p>
        </div>
        <div className="order-detail-actions">
          <button className="btn-secondary" onClick={handleBack}>
            Quay lại đơn hàng
          </button>
        </div>
      </header>

      {message && <div className="order-detail-message">{message}</div>}

      {loading ? (
        <div className="order-detail-empty">Đang tải chi tiết đơn hàng...</div>
      ) : !order ? (
        <div className="order-detail-empty">Không tìm thấy đơn hàng.</div>
      ) : (
        <div className="order-detail-card">
          <section className="order-detail-summary">
            <h2>Thông tin đơn hàng</h2>
            <p><strong>Mã đơn:</strong> {order.orderCode || order.id}</p>
            <p><strong>Trạng thái:</strong> {order.orderStatus || "Chưa rõ"}</p>
            <p><strong>Ngày:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}</p>
            <p><strong>Phương thức:</strong> {order.paymentMethod || "Không xác định"}</p>
            <p><strong>Tổng:</strong> {(order.totalAmount || 0).toLocaleString()} đ</p>
          </section>

          <section className="order-detail-section">
            <h2>Vận chuyển</h2>
            <p><strong>Hãng:</strong> {order.shippingProvider || "Chưa bàn giao vận chuyển"}</p>
            <p><strong>Mã vận đơn:</strong> {order.trackingCode || "-"}</p>
            <p><strong>Phí vận chuyển:</strong> {(order.shippingFee || 0).toLocaleString("vi-VN")} ₫</p>
            {order.shippedAt && <p><strong>Thời gian bàn giao:</strong> {new Date(order.shippedAt).toLocaleString("vi-VN")}</p>}
            {order.deliveredAt && <p><strong>Thời gian giao thành công:</strong> {new Date(order.deliveredAt).toLocaleString("vi-VN")}</p>}
          </section>

          <section className="order-detail-section">
            <h2>Địa chỉ nhận hàng</h2>
            <p>{order.shippingAddress?.fullName || "-"}</p>
            <p>{order.shippingAddress?.phone || "-"}</p>
            <p>{order.shippingAddress?.detail || "-"}</p>
            <p>
              {order.shippingAddress?.ward || ""}, {order.shippingAddress?.district || ""}, {order.shippingAddress?.province || ""}
            </p>
          </section>

          <section className="order-detail-section">
            <h2>Sản phẩm</h2>
            {order.items?.map((item, index) => {
              const key = itemKey(item);
              const isOpen = openReviewKey === key;
              const isSubmitted = submittedKeys.has(key);
              const draft = getDraft(key);

              return (
                <div key={`${key}-${index}`} className="order-detail-item">
                  <div className="order-detail-item-row">
                    <div>
                      <strong>{item.productName || item.productId}</strong>
                      <p>SKU: {item.variantSku || "-"}</p>
                      <p>Số lượng: {item.quantity}</p>
                    </div>
                    <div className="order-detail-item-right">
                      <div>{(item.price || 0).toLocaleString()} đ</div>

                      {canReview && (
                        isSubmitted ? (
                          <span className="order-review-done">Đã đánh giá</span>
                        ) : (
                          <button
                            type="button"
                            className="btn-secondary order-review-btn"
                            onClick={() => setOpenReviewKey(isOpen ? null : key)}
                          >
                            {isOpen ? "Đóng" : "Đánh giá"}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {isOpen && !isSubmitted && (
                    <div className="order-review-form">
                      <div className="review-star-picker">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            className={star <= draft.rating ? "star active" : "star"}
                            onClick={() => setDraft(key, { rating: star })}
                            aria-label={`${star} sao`}
                          >
                            ★
                          </button>
                        ))}
                      </div>

                      <textarea
                        rows={3}
                        placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                        value={draft.comment}
                        onChange={(e) => setDraft(key, { comment: e.target.value })}
                      />

                      <div className="order-review-actions">
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={submittingKey === key}
                          onClick={() => handleSubmitReview(item)}
                        >
                          {submittingKey === key ? "Đang gửi..." : "Gửi đánh giá"}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setOpenReviewKey(null)}
                        >
                          Huỷ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        </div>
      )}
    </div>
  );
}
