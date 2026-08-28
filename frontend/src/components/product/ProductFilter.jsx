import React, { useState } from "react";
import { Filter, Star, RotateCcw } from "lucide-react";
import Button from "../common/Button";
import RatingStars from "../common/RatingStars";

export default function ProductFilter({
  categories = [],
  selectedCategory = "",
  onSelectCategory,
  priceRange = { min: "", max: "" },
  onApplyPriceRange,
  selectedRating = 0,
  onSelectRating,
  selectedLocation = "",
  onSelectLocation,
  onReset,
}) {
  const [localMin, setLocalMin] = useState(priceRange.min);
  const [localMax, setLocalMax] = useState(priceRange.max);

  const handleApplyPrice = (e) => {
    e.preventDefault();
    if (onApplyPriceRange) {
      onApplyPriceRange({ min: localMin, max: localMax });
    }
  };

  const locations = ["TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Hải Phòng"];

  return (
    <aside
      className="card"
      style={{
        padding: "16px",
        background: "var(--surface)",
        borderRadius: "var(--r-md)",
        border: "1px solid var(--border-light)",
        height: "fit-content",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "12px",
          borderBottom: "1px solid var(--border-light)",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "800", fontSize: "14px" }}>
          <Filter size={16} color="var(--primary)" />
          <span>BỘ LỌC TÌM KIẾM</span>
        </div>
        <button
          onClick={onReset}
          style={{
            fontSize: "12px",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          title="Xóa tất cả bộ lọc"
        >
          <RotateCcw size={12} />
          <span>Xóa</span>
        </button>
      </div>

      {/* Danh mục */}
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "10px", color: "var(--text)" }}>
          Theo Danh Mục
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "200px", overflowY: "auto" }}>
          <button
            onClick={() => onSelectCategory("")}
            style={{
              textAlign: "left",
              fontSize: "13px",
              padding: "4px 8px",
              borderRadius: "4px",
              background: selectedCategory === "" ? "var(--primary-light)" : "transparent",
              color: selectedCategory === "" ? "var(--primary)" : "var(--text)",
              fontWeight: selectedCategory === "" ? "700" : "400",
            }}
          >
            Tất cả ngành hàng
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id || cat.name}
              onClick={() => onSelectCategory(cat.id || cat.name)}
              style={{
                textAlign: "left",
                fontSize: "13px",
                padding: "4px 8px",
                borderRadius: "4px",
                background: selectedCategory === (cat.id || cat.name) ? "var(--primary-light)" : "transparent",
                color: selectedCategory === (cat.id || cat.name) ? "var(--primary)" : "var(--text)",
                fontWeight: selectedCategory === (cat.id || cat.name) ? "700" : "400",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {cat.icon && <span>{cat.icon}</span>}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Khoảng giá */}
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "10px", color: "var(--text)" }}>
          Khoảng Giá (₫)
        </h4>
        <form onSubmit={handleApplyPrice} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <input
              type="number"
              placeholder="₫ TỪ"
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                fontSize: "12px",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                outline: "none",
              }}
            />
            <span>-</span>
            <input
              type="number"
              placeholder="₫ ĐẾN"
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                fontSize: "12px",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                outline: "none",
              }}
            />
          </div>
          <Button variant="primary" size="sm" type="submit" block>
            ÁP DỤNG
          </Button>
        </form>
      </div>

      {/* Đánh giá */}
      <div style={{ marginBottom: "20px" }}>
        <h4 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "10px", color: "var(--text)" }}>
          Đánh Giá
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {[5, 4, 3].map((stars) => (
            <button
              key={stars}
              onClick={() => onSelectRating(selectedRating === stars ? 0 : stars)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 8px",
                borderRadius: "4px",
                background: selectedRating === stars ? "var(--primary-light)" : "transparent",
                fontSize: "12px",
                color: "var(--text)",
              }}
            >
              <RatingStars rating={stars} size={13} />
              <span>từ {stars} sao</span>
            </button>
          ))}
        </div>
      </div>

      {/* Nơi bán */}
      <div>
        <h4 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "10px", color: "var(--text)" }}>
          Nơi Bán
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {locations.map((loc) => (
            <label
              key={loc}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={selectedLocation === loc}
                onChange={() => onSelectLocation(selectedLocation === loc ? "" : loc)}
                style={{ accentColor: "var(--primary)" }}
              />
              <span>{loc}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
