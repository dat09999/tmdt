import React from "react";
import { PackageOpen } from "lucide-react";
import Button from "./Button";

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = "Chưa có dữ liệu",
  description = "Hiện tại không có mục nào để hiển thị trong danh sách này.",
  actionText,
  onAction,
  className = "",
}) {
  return (
    <div
      className={`empty-state card ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        background: "var(--surface)",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--border-light)",
      }}
    >
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: "var(--primary-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--primary)",
          marginBottom: "16px",
        }}
      >
        <Icon size={36} strokeWidth={1.5} />
      </div>

      <h3
        style={{
          fontSize: "16px",
          fontWeight: "700",
          color: "var(--text)",
          marginBottom: "8px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: "13px",
          color: "var(--text-secondary)",
          maxWidth: "400px",
          lineHeight: "1.6",
          marginBottom: actionText ? "20px" : "0",
        }}
      >
        {description}
      </p>

      {actionText && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
