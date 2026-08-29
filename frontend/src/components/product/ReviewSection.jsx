import React, { useState } from "react";
import RatingStars from "../common/RatingStars";
import Button from "../common/Button";
import Modal from "../common/Modal";
import { productService } from "../../services/productService";
import { useAuth } from "../../pages/Authcontext";
import { formatDate } from "../../utils/formatters";
import {
  MessageSquare,
  ThumbsUp,
  Camera,
  Star,
  Plus,
  CheckCircle,
  Store,
  ShieldCheck,
  Send,
} from "lucide-react";

export default function ReviewSection({
  productId,
  reviews = [],
  averageRating = 5,
  totalReviews = 0,
  onReviewAdded,
}) {
  const { user } = useAuth();
  const [reviewsList, setReviewsList] = useState(reviews);
  const [filterRating, setFilterRating] = useState(0); // 0 = all
  const [filterWithImages, setFilterWithImages] = useState(false);
  const [helpfulSet, setHelpfulSet] = useState(new Set());

  // Review Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
    variantName: "Tiêu chuẩn",
    imageUrl: "",
  });
  const [hoverRating, setHoverRating] = useState(0);

  // Sync if parent updates reviews
  React.useEffect(() => {
    if (reviews && reviews.length > 0) {
      setReviewsList(reviews);
    }
  }, [reviews]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleHelpfulClick = async (revId) => {
    if (helpfulSet.has(revId)) return;
    setHelpfulSet((prev) => new Set(prev).add(revId));
    setReviewsList((prev) =>
      prev.map((r) =>
        r.id === revId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r
      )
    );
    await productService.markReviewHelpful(revId);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Vui lòng đăng nhập để gửi đánh giá sản phẩm!");
      window.location.href = "/login";
      return;
    }

    if (!reviewForm.comment.trim()) {
      showToast("Vui lòng nhập nội dung đánh giá!");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        productId,
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
        variantSku: reviewForm.variantName,
        images: reviewForm.imageUrl ? [reviewForm.imageUrl] : [],
      };

      const res = await productService.createReview(payload);

      const newReviewItem = {
        id: res?.id || `rev-${Date.now()}`,
        userId: user.userId,
        userName: user.fullName || user.email?.split("@")[0] || "Bạn (Người Mua)",
        avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email || "user"}`,
        rating: reviewForm.rating,
        content: reviewForm.comment.trim(),
        variant: reviewForm.variantName,
        date: new Date().toISOString(),
        images: reviewForm.imageUrl ? [reviewForm.imageUrl] : [],
        helpfulCount: 0,
      };

      const updated = [newReviewItem, ...reviewsList];
      setReviewsList(updated);
      if (onReviewAdded) onReviewAdded(newReviewItem);

      showToast("🎉 Cảm ơn bạn! Đánh giá đã được gửi thành công!");
      setModalOpen(false);
      setReviewForm({
        rating: 5,
        comment: "",
        variantName: "Tiêu chuẩn",
        imageUrl: "",
      });
    } catch (err) {
      showToast(err.message || "Không thể gửi đánh giá. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter reviews
  const filteredReviews = reviewsList.filter((r) => {
    if (filterRating > 0 && Math.floor(r.rating) !== filterRating) return false;
    if (filterWithImages && (!r.images || r.images.length === 0)) return false;
    return true;
  });

  const count5 = reviewsList.filter((r) => Math.floor(r.rating) === 5).length;
  const count4 = reviewsList.filter((r) => Math.floor(r.rating) === 4).length;
  const count3 = reviewsList.filter((r) => Math.floor(r.rating) === 3).length;
  const count2 = reviewsList.filter((r) => Math.floor(r.rating) === 2).length;
  const count1 = reviewsList.filter((r) => Math.floor(r.rating) === 1).length;
  const countImages = reviewsList.filter((r) => r.images && r.images.length > 0).length;

  return (
    <div
      className="card"
      style={{
        padding: "24px",
        background: "var(--surface)",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--border-light)",
        position: "relative",
      }}
    >
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            right: "20px",
            zIndex: 9999,
            backgroundColor: "#10b981",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "var(--r-md)",
            fontSize: "14px",
            fontWeight: "600",
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with CTA Button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "800",
            color: "var(--text)",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Đánh Giá Sản Phẩm
        </h3>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            if (!user) {
              window.location.href = "/login";
            } else {
              setModalOpen(true);
            }
          }}
        >
          Viết Đánh Giá Của Bạn
        </Button>
      </div>

      {/* Summary Box */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "24px",
          padding: "20px 24px",
          backgroundColor: "var(--primary-light)",
          borderRadius: "var(--r-md)",
          border: "1px solid var(--border-primary)",
          marginBottom: "24px",
        }}
      >
        <div style={{ textAlign: "center", minWidth: "140px" }}>
          <div style={{ fontSize: "32px", fontWeight: "900", color: "var(--primary)", lineHeight: 1 }}>
            {Number(averageRating || 5).toFixed(1)}
            <span style={{ fontSize: "18px", fontWeight: "600" }}> trên 5</span>
          </div>
          <div style={{ marginTop: "6px" }}>
            <RatingStars rating={averageRating || 5} size={18} />
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
            {reviewsList.length} lượt đánh giá
          </div>
        </div>

        {/* Filter Chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", flex: 1 }}>
          {[
            { label: `Tất Cả (${reviewsList.length})`, value: 0 },
            { label: `5 Sao (${count5})`, value: 5 },
            { label: `4 Sao (${count4})`, value: 4 },
            { label: `3 Sao (${count3})`, value: 3 },
            { label: `2 Sao (${count2})`, value: 2 },
            { label: `1 Sao (${count1})`, value: 1 },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => {
                setFilterRating(item.value);
                setFilterWithImages(false);
              }}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--r-sm)",
                border: filterRating === item.value && !filterWithImages ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                backgroundColor: filterRating === item.value && !filterWithImages ? "#fff" : "var(--surface)",
                color: filterRating === item.value && !filterWithImages ? "var(--primary)" : "var(--text)",
                fontSize: "13px",
                fontWeight: filterRating === item.value && !filterWithImages ? "700" : "500",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {item.label}
            </button>
          ))}

          {countImages > 0 && (
            <button
              onClick={() => {
                setFilterWithImages(!filterWithImages);
                setFilterRating(0);
              }}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--r-sm)",
                border: filterWithImages ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                backgroundColor: filterWithImages ? "#fff" : "var(--surface)",
                color: filterWithImages ? "var(--primary)" : "var(--text)",
                fontSize: "13px",
                fontWeight: filterWithImages ? "700" : "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Camera size={14} />
              <span>Có Hình Ảnh ({countImages})</span>
            </button>
          )}
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
          <MessageSquare size={40} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
          <p style={{ fontSize: "14px", fontWeight: "600" }}>Chưa có đánh giá nào cho phân loại này.</p>
          <p style={{ fontSize: "12px", marginTop: "4px" }}>Hãy là người đầu tiên chia sẻ cảm nhận về sản phẩm!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {filteredReviews.map((rev) => {
            const isLiked = helpfulSet.has(rev.id);
            return (
              <div
                key={rev.id}
                style={{
                  display: "flex",
                  gap: "14px",
                  paddingBottom: "20px",
                  borderBottom: "1px solid var(--border-light)",
                }}
              >
                {/* User Avatar */}
                <img
                  src={rev.avatar || "https://i.pravatar.cc/100"}
                  alt={rev.userName}
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                    border: "1px solid var(--border)",
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--text)" }}>
                      {rev.userName}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#059669",
                        backgroundColor: "#ecfdf5",
                        padding: "1px 6px",
                        borderRadius: "3px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      <ShieldCheck size={12} /> Đã mua hàng
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "4px 0" }}>
                    <RatingStars rating={rev.rating} size={13} />
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                      {formatDate(rev.date, true)}
                    </span>
                  </div>

                  {rev.variant && (
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                      Phân loại: <strong>{rev.variant}</strong>
                    </div>
                  )}

                  <p style={{ fontSize: "13.5px", color: "var(--text)", lineHeight: "1.6", marginTop: "4px" }}>
                    {rev.content}
                  </p>

                  {/* Review Images */}
                  {rev.images && rev.images.length > 0 && (
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                      {rev.images.map((imgUrl, i) => (
                        <img
                          key={i}
                          src={imgUrl}
                          alt="Review upload"
                          style={{
                            width: "76px",
                            height: "76px",
                            borderRadius: "6px",
                            objectFit: "cover",
                            border: "1px solid var(--border)",
                            cursor: "pointer",
                          }}
                          onClick={() => window.open(imgUrl, "_blank")}
                        />
                      ))}
                    </div>
                  )}

                  {/* Shop Reply Box */}
                  {rev.shopReply && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px 16px",
                        backgroundColor: "var(--surface-muted)",
                        borderRadius: "var(--r-md)",
                        borderLeft: "3px solid var(--primary)",
                        fontSize: "13px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", color: "var(--primary)", marginBottom: "4px" }}>
                        <Store size={14} />
                        <span>Phản Hồi Của Người Bán:</span>
                      </div>
                      <div style={{ color: "var(--text-secondary)", lineHeight: "1.5" }}>
                        {rev.shopReply}
                      </div>
                    </div>
                  )}

                  {/* Helpful Button */}
                  <div style={{ marginTop: "10px" }}>
                    <button
                      onClick={() => handleHelpfulClick(rev.id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        color: isLiked ? "var(--primary)" : "var(--text-secondary)",
                        fontWeight: isLiked ? "700" : "500",
                        cursor: "pointer",
                        background: isLiked ? "var(--primary-light)" : "transparent",
                        padding: "4px 10px",
                        borderRadius: "99px",
                        border: isLiked ? "1px solid var(--border-primary)" : "1px solid var(--border)",
                      }}
                    >
                      <ThumbsUp size={13} color={isLiked ? "var(--primary)" : "currentColor"} />
                      <span>Hữu ích ({rev.helpfulCount || 0})</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Write Review */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Đánh Giá Sản Phẩm"
      >
        <form onSubmit={handleSubmitReview} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Rating selector */}
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <label style={{ fontSize: "14px", fontWeight: "700", display: "block", marginBottom: "8px" }}>
              Chất lượng sản phẩm
            </label>
            <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= (hoverRating || reviewForm.rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      transform: isFilled ? "scale(1.15)" : "scale(1)",
                      transition: "transform 0.15s",
                    }}
                  >
                    <Star
                      size={32}
                      fill={isFilled ? "#f59e0b" : "none"}
                      color={isFilled ? "#f59e0b" : "#d1d5db"}
                    />
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--primary)", marginTop: "6px" }}>
              {reviewForm.rating === 5 && "Tuyệt vời ⭐⭐⭐⭐⭐"}
              {reviewForm.rating === 4 && "Hài lòng ⭐⭐⭐⭐"}
              {reviewForm.rating === 3 && "Bình thường ⭐⭐⭐"}
              {reviewForm.rating === 2 && "Không hài lòng ⭐⭐"}
              {reviewForm.rating === 1 && "Rất tệ ⭐"}
            </div>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
              Phân Loại Sản Phẩm Đã Mua:
            </label>
            <input
              type="text"
              value={reviewForm.variantName}
              onChange={(e) => setReviewForm({ ...reviewForm, variantName: e.target.value })}
              placeholder="VD: Bản 256GB - Màu Đen"
              style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "4px" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
              Nội Dung Đánh Giá (Tối thiểu 10 ký tự) <span style={{ color: "var(--error)" }}>*</span>:
            </label>
            <textarea
              rows={4}
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              placeholder="Chia sẻ cảm nhận về chất lượng sản phẩm, dịch vụ đóng gói và tốc độ giao hàng của shop..."
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px" }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
              Hình Ảnh Đánh Giá (URL):
            </label>
            <input
              type="url"
              value={reviewForm.imageUrl}
              onChange={(e) => setReviewForm({ ...reviewForm, imageUrl: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "4px" }}
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            type="submit"
            block
            loading={submitting}
            icon={Send}
            style={{ marginTop: "8px" }}
          >
            Gửi Đánh Giá Ngay
          </Button>
        </form>
      </Modal>
    </div>
  );
}
