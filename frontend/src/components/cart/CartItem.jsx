import React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

export default function CartItem({
  item,
  selected = false,
  isOwnItem = false,
  onSelectChange,
  onQuantityChange,
  onRemove,
}) {
  const lineTotal = (item.price || 0) * (item.quantity || 1);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "16px 0",
        borderBottom: "1px solid var(--border-light)",
        gap: "12px",
        opacity: isOwnItem ? 0.75 : 1,
        backgroundColor: isOwnItem ? "rgba(254, 243, 199, 0.2)" : "transparent",
      }}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={!isOwnItem && selected}
        disabled={isOwnItem}
        onChange={(e) => onSelectChange(e.target.checked)}
        title={isOwnItem ? "Bạn không thể tự mua sản phẩm từ chính shop của mình" : ""}
        style={{
          width: "18px",
          height: "18px",
          accentColor: "var(--primary)",
          cursor: isOwnItem ? "not-allowed" : "pointer",
        }}
      />

      {/* Image */}
      <a href={`/product/${item.productId}`} style={{ flexShrink: 0 }}>
        <img
          src={item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80"}
          alt={item.productName || item.name}
          style={{
            width: "80px",
            height: "80px",
            objectFit: "cover",
            borderRadius: "var(--r-sm)",
            border: "1px solid var(--border)",
          }}
        />
      </a>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <a
          href={`/product/${item.productId}`}
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: "600",
            color: "var(--text)",
            marginBottom: "4px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.productName || item.name || "Sản phẩm"}
        </a>

        {item.variantSku && (
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              background: "var(--surface-muted)",
              padding: "2px 8px",
              borderRadius: "4px",
              display: "inline-block",
              marginBottom: "6px",
            }}
          >
            Phân loại: {item.variantSku}
          </div>
        )}

        {isOwnItem && (
          <div
            style={{
              fontSize: "11px",
              color: "#c2410c",
              backgroundColor: "#ffedd5",
              border: "1px solid #fed7aa",
              padding: "2px 6px",
              borderRadius: "4px",
              fontWeight: "600",
              display: "inline-block",
              marginBottom: "6px",
              marginLeft: item.variantSku ? "6px" : "0",
            }}
          >
            🚫 Sản phẩm của shop bạn
          </div>
        )}

        <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--primary)" }}>
          {formatCurrency(item.price)}
        </div>
      </div>

      {/* Quantity Selector */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-sm)",
          overflow: "hidden",
          background: "var(--surface)",
        }}
      >
        <button
          onClick={() => item.quantity > 1 && onQuantityChange(item.quantity - 1)}
          disabled={item.quantity <= 1}
          style={{
            padding: "6px 8px",
            background: item.quantity <= 1 ? "var(--surface-muted)" : "transparent",
            color: item.quantity <= 1 ? "var(--text-tertiary)" : "var(--text)",
            cursor: item.quantity <= 1 ? "not-allowed" : "pointer",
          }}
        >
          <Minus size={12} />
        </button>
        <span style={{ width: "36px", textAlign: "center", fontSize: "13px", fontWeight: "600" }}>
          {item.quantity || 1}
        </span>
        <button
          onClick={() => onQuantityChange((item.quantity || 1) + 1)}
          style={{ padding: "6px 8px", cursor: "pointer" }}
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Line Total */}
      <div
        className="hide-mobile"
        style={{
          width: "120px",
          textAlign: "right",
          fontSize: "14px",
          fontWeight: "800",
          color: "var(--primary)",
        }}
      >
        {formatCurrency(lineTotal)}
      </div>

      {/* Delete button */}
      <button
        onClick={onRemove}
        title="Xóa khỏi giỏ hàng"
        style={{
          padding: "6px",
          color: "var(--text-secondary)",
          transition: "color 0.15s",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--error)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
