import React from "react";
import { Store, Truck, RotateCcw } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { ORDER_STATUS } from "../../utils/constants";
import Button from "../common/Button";

export default function OrderCard({ order, onCancelOrder }) {
  if (!order) return null;

  const statusInfo = ORDER_STATUS[order.orderStatus] || {
    label: order.orderStatus || "Không xác định",
    color: "#6b7280",
    badgeClass: "badge-neutral",
  };

  const statusKey = (order.orderStatus || "").toUpperCase();

  return (
    <div
      className="card"
      style={{
        background: "var(--surface)",
        borderRadius: "var(--r-md)",
        border: "1px solid var(--border-light)",
        marginBottom: "16px",
        overflow: "hidden",
      }}
    >
      {/* Header: Shop Name & Status Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          borderBottom: "1px solid var(--border-light)",
          backgroundColor: "var(--surface-muted)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Store size={16} color="var(--primary)" />
          <strong style={{ fontSize: "14px", color: "var(--text)" }}>
            {order.shop?.name || "Cửa hàng DoMix Mall"}
          </strong>
          <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>|</span>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            Mã: #{order.orderCode || order.id}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {order.shippingProvider && (
            <span
              className="hide-mobile"
              style={{
                fontSize: "12px",
                color: "#059669",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Truck size={13} />
              <span>{order.shippingProvider}</span>
            </span>
          )}
          <span
            style={{
              padding: "4px 10px",
              borderRadius: "99px",
              fontSize: "12px",
              fontWeight: "700",
              color: statusInfo.color,
              backgroundColor: `${statusInfo.color}15`,
              border: `1px solid ${statusInfo.color}40`,
            }}
          >
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Product Items */}
      <div style={{ padding: "16px 18px" }}>
        {(order.items || []).map((item, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              paddingBottom: idx === order.items.length - 1 ? 0 : "12px",
              marginBottom: idx === order.items.length - 1 ? 0 : "12px",
              borderBottom:
                idx === order.items.length - 1 ? "none" : "1px solid var(--border-light)",
            }}
          >
            <img
              src={item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&auto=format&fit=crop&q=80"}
              alt={item.productName || "Sản phẩm"}
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "var(--r-sm)",
                objectFit: "cover",
                border: "1px solid var(--border)",
              }}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "var(--text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.productName || item.productId}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                Phân loại: {item.variantName || item.variantSku || "Mặc định"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "2px" }}>
                Số lượng: x{item.quantity}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--primary)" }}>
                {formatCurrency(item.price)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Actions */}
      <div
        style={{
          padding: "14px 18px",
          borderTop: "1px solid var(--border-light)",
          backgroundColor: "var(--surface)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          <span>Tổng số tiền: </span>
          <strong style={{ fontSize: "17px", color: "var(--primary)", fontWeight: "900" }}>
            {formatCurrency(order.totalAmount || 0)}
          </strong>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {statusKey === "DELIVERED" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = `/refunds?orderId=${order.id}`)}
              >
                <RotateCcw size={14} />
                <span>Trả hàng / Hoàn tiền</span>
              </Button>
              <Button variant="secondary" size="sm">
                Đánh giá
              </Button>
            </>
          )}

          {statusKey === "PENDING" && onCancelOrder && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onCancelOrder(order.id)}
            >
              Hủy Đơn Hàng
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => (window.location.href = `/orders/${order.id || order.orderCode}`)}
          >
            Chi Tiết Đơn Hàng
          </Button>
        </div>
      </div>
    </div>
  );
}
