import React, { useState } from "react";
import RatingStars from "../common/RatingStars";
import { MessageSquare, ThumbsUp, Camera } from "lucide-react";
import { formatDate } from "../../utils/formatters";

export default function ReviewSection({ reviews = [], averageRating = 4.9, totalReviews = 0 }) {
  const [filterRating, setFilterRating] = useState(0); // 0 = all

  const filteredReviews =
    filterRating === 0
      ? reviews
      : reviews.filter((r) => Math.floor(r.rating) === filterRating);

  return (
    <div
      className="card"
      style={{
        padding: "24px",
        background: "var(--surface)",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--border-light)",
      }}
    >
      <h3
        style={{
          fontSize: "18px",
          fontWeight: "800",
          color: "var(--text)",
          marginBottom: "20px",
          textTransform: "uppercase",
        }}
      >
        Đánh Giá Sản Phẩm
      </h3>

      {/* Summary Box */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "24px",
          padding: "20px",
          backgroundColor: "var(--primary-light)",
          borderRadius: "var(--r-md)",
          border: "1px solid var(--border-primary)",
          marginBottom: "24px",
        }}
      >
        <div style={{ textAlign: "center", minWidth: "140px" }}>
          <div style={{ fontSize: "32px", fontWeight: "900", color: "var(--primary)", lineHeight: 1 }}>
            {Number(averageRating).toFixed(1)}
            <span style={{ fontSize: "18px", fontWeight: "600" }}> trên 5</span>
          </div>
          <div style={{ marginTop: "6px" }}>
            <RatingStars rating={averageRating} size={18} />
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
            {totalReviews || reviews.length} lượt đánh giá
          </div>
        </div>

        {/* Filter Chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", flex: 1 }}>
          {[
            { label: "Tất Cả", value: 0 },
            { label: "5 Sao", value: 5 },
            { label: "4 Sao", value: 4 },
            { label: "3 Sao", value: 3 },
            { label: "2 Sao", value: 2 },
            { label: "1 Sao", value: 1 },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilterRating(item.value)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--r-sm)",
                border: filterRating === item.value ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                backgroundColor: filterRating === item.value ? "#fff" : "var(--surface)",
                color: filterRating === item.value ? "var(--primary)" : "var(--text)",
                fontSize: "13px",
                fontWeight: filterRating === item.value ? "700" : "500",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-secondary)" }}>
          <MessageSquare size={32} style={{ opacity: 0.4, margin: "0 auto 8px" }} />
          <p>Chưa có đánh giá nào cho phân loại sao này.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {filteredReviews.map((rev) => (
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
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)" }}>
                  {rev.userName}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "4px 0" }}>
                  <RatingStars rating={rev.rating} size={12} />
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                    {formatDate(rev.date)}
                  </span>
                </div>

                {rev.variant && (
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Phân loại hàng: {rev.variant}
                  </div>
                )}

                <p style={{ fontSize: "13px", color: "var(--text)", lineHeight: "1.5", marginTop: "4px" }}>
                  {rev.content}
                </p>

                {/* Review Images */}
                {rev.images && rev.images.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                    {rev.images.map((imgUrl, i) => (
                      <img
                        key={i}
                        src={imgUrl}
                        alt="Review upload"
                        style={{
                          width: "72px",
                          height: "72px",
                          borderRadius: "6px",
                          objectFit: "cover",
                          border: "1px solid var(--border)",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
