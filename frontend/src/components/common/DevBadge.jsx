import React from "react";
import { Sparkles, Construction } from "lucide-react";

export default function DevBadge({
  text = "Đang phát triển (Mock Data)",
  variant = "badge", // "badge" | "banner" | "corner"
  className = "",
}) {
  if (variant === "banner") {
    return (
      <div
        className={`dev-banner ${className}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 14px",
          background: "linear-gradient(90deg, #fff8e6 0%, #ffedd5 100%)",
          border: "1px dashed #f59e0b",
          borderRadius: "8px",
          color: "#b45309",
          fontSize: "12px",
          fontWeight: "600",
          marginBottom: "12px",
        }}
      >
        <Construction size={16} className="text-warning" />
        <span>
          <strong>Ghi chú:</strong> Chức năng này đang được phát triển backend. Hiện đang sử dụng Mock Data mô phỏng đầy đủ giao diện.
        </span>
      </div>
    );
  }

  if (variant === "corner") {
    return (
      <div
        className={`dev-corner-badge ${className}`}
        style={{
          position: "fixed",
          bottom: "16px",
          left: "16px",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "#1f2937",
          color: "#fbbf24",
          padding: "6px 12px",
          borderRadius: "99px",
          fontSize: "11px",
          fontWeight: "700",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          border: "1px solid #374151",
        }}
      >
        <span className="dev-badge-dot" />
        <span>{text}</span>
      </div>
    );
  }

  return (
    <span className={`dev-badge ${className}`} title="Chức năng đang phát triển API, hiển thị giao diện với dữ liệu mô phỏng">
      <span className="dev-badge-dot" />
      <Sparkles size={12} />
      <span>{text}</span>
    </span>
  );
}
