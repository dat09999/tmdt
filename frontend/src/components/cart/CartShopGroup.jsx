import React from "react";
import { Store, Tag } from "lucide-react";
import CartItem from "./CartItem";

export default function CartShopGroup({
  shopId,
  shopName = "Cửa hàng chính hãng",
  items = [],
  selectedKeys,
  onSelectItem,
  onSelectShop,
  onQuantityChange,
  onRemoveItem,
}) {
  const itemKey = (item) => `${item.productId}__${item.variantSku || ""}`;

  const allShopItemsSelected =
    items.length > 0 && items.every((item) => selectedKeys.has(itemKey(item)));

  return (
    <div
      className="card"
      style={{
        marginBottom: "16px",
        background: "var(--surface)",
        borderRadius: "var(--r-md)",
        border: "1px solid var(--border-light)",
        padding: "16px",
      }}
    >
      {/* Shop Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          paddingBottom: "12px",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <input
          type="checkbox"
          checked={allShopItemsSelected}
          onChange={(e) => onSelectShop(items, e.target.checked)}
          style={{
            width: "18px",
            height: "18px",
            accentColor: "var(--primary)",
            cursor: "pointer",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", fontSize: "14px" }}>
          <Store size={16} color="var(--primary)" />
          <span>{shopName}</span>
        </div>
        <span
          style={{
            fontSize: "10px",
            background: "#d0011b",
            color: "#fff",
            fontWeight: "800",
            padding: "1px 5px",
            borderRadius: "2px",
          }}
        >
          Mall
        </span>
      </div>

      {/* Items list */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {items.map((item) => {
          const key = itemKey(item);
          return (
            <CartItem
              key={key}
              item={item}
              selected={selectedKeys.has(key)}
              onSelectChange={(checked) => onSelectItem(item, checked)}
              onQuantityChange={(qty) => onQuantityChange(item, qty)}
              onRemove={() => onRemoveItem(item)}
            />
          );
        })}
      </div>

      {/* Shop Voucher shortcut */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "10px",
          fontSize: "12px",
          color: "var(--text-secondary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Tag size={14} color="var(--primary)" />
          <span>Voucher của Shop: Giảm 15k cho đơn từ 200k</span>
        </div>
        <button
          style={{
            color: "var(--primary)",
            fontWeight: "700",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          Xem thêm voucher
        </button>
      </div>
    </div>
  );
}
