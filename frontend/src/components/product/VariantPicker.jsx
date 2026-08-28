import React from "react";
import { Check, Minus, Plus } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

export default function VariantPicker({
  variants = [],
  selectedVariant,
  onSelectVariant,
  quantity = 1,
  onQuantityChange,
  maxStock = 99,
}) {
  const activeVariants = variants.filter((v) => v.active !== false);

  const handleDecrease = () => {
    if (quantity > 1) onQuantityChange(quantity - 1);
  };

  const handleIncrease = () => {
    if (quantity < maxStock) onQuantityChange(quantity + 1);
  };

  const handleInputChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) {
      onQuantityChange(1);
    } else if (val > maxStock) {
      onQuantityChange(maxStock);
    } else {
      onQuantityChange(val);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Variant Pills */}
      {activeVariants.length > 0 && (
        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "700",
              color: "var(--text-secondary)",
              marginBottom: "10px",
            }}
          >
            Phân Loại Hàng ({activeVariants.length} lựa chọn):
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {activeVariants.map((v) => {
              const isSelected = selectedVariant?.sku === v.sku;
              const isOutOfStock = (v.stock || 0) <= 0;

              return (
                <button
                  key={v.sku}
                  disabled={isOutOfStock}
                  onClick={() => onSelectVariant(v)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "var(--r-sm)",
                    border: isSelected
                      ? "2px solid var(--primary)"
                      : "1px solid var(--border)",
                    backgroundColor: isSelected ? "var(--primary-light)" : "var(--surface)",
                    color: isSelected
                      ? "var(--primary)"
                      : isOutOfStock
                      ? "var(--text-tertiary)"
                      : "var(--text)",
                    fontWeight: isSelected ? "700" : "500",
                    fontSize: "13px",
                    cursor: isOutOfStock ? "not-allowed" : "pointer",
                    position: "relative",
                    transition: "all 0.15s",
                  }}
                >
                  <span>{v.name}</span>
                  {v.price && (
                    <span style={{ fontSize: "11px", opacity: 0.85 }}>
                      ({formatCurrency(v.discountPrice ?? v.price)})
                    </span>
                  )}
                  {isSelected && <Check size={14} color="var(--primary)" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity Picker */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <label
          style={{
            fontSize: "13px",
            fontWeight: "700",
            color: "var(--text-secondary)",
            minWidth: "80px",
          }}
        >
          Số Lượng:
        </label>
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
            onClick={handleDecrease}
            disabled={quantity <= 1}
            style={{
              padding: "8px 12px",
              background: quantity <= 1 ? "var(--surface-muted)" : "transparent",
              color: quantity <= 1 ? "var(--text-tertiary)" : "var(--text)",
              borderRight: "1px solid var(--border)",
              cursor: quantity <= 1 ? "not-allowed" : "pointer",
            }}
          >
            <Minus size={14} />
          </button>
          <input
            type="number"
            value={quantity}
            onChange={handleInputChange}
            min={1}
            max={maxStock}
            style={{
              width: "48px",
              textAlign: "center",
              border: "none",
              outline: "none",
              fontSize: "14px",
              fontWeight: "600",
            }}
          />
          <button
            onClick={handleIncrease}
            disabled={quantity >= maxStock}
            style={{
              padding: "8px 12px",
              background: quantity >= maxStock ? "var(--surface-muted)" : "transparent",
              color: quantity >= maxStock ? "var(--text-tertiary)" : "var(--text)",
              borderLeft: "1px solid var(--border)",
              cursor: quantity >= maxStock ? "not-allowed" : "pointer",
            }}
          >
            <Plus size={14} />
          </button>
        </div>

        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          {maxStock > 0 ? `${maxStock} sản phẩm có sẵn` : "Hết hàng"}
        </span>
      </div>
    </div>
  );
}
