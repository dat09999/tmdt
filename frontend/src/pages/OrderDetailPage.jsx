import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import SubNav from "../components/layout/SubNav";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import OrderTimeline from "../components/order/OrderTimeline";
import Button from "../components/common/Button";
import { orderService } from "../services/orderService";
import { formatCurrency, formatDate } from "../utils/formatters";
import { ORDER_STATUS } from "../utils/constants";
import {
  MapPin,
  Truck,
  CreditCard,
  RotateCcw,
  ArrowLeft,
  Store,
  CheckCircle,
} from "lucide-react";

function buildOrderTimeline(order) {
  if (!order) return [];
  const status = (order.orderStatus || "PENDING").toUpperCase();
  const isCancelled = status === "CANCELLED";

  if (isCancelled) {
    return [
      {
        title: "Đơn Hàng Đã Đặt",
        time: order.createdAt ? formatDate(order.createdAt) : "Đã đặt",
        done: true,
        current: false,
      },
      {
        title: "Đơn Hàng Đã Hủy",
        time: order.updatedAt ? formatDate(order.updatedAt) : "Đã hủy",
        done: true,
        current: true,
        isCancelled: true,
      },
    ];
  }

  const isStep1Done = true;
  const isStep1Current = status === "PENDING" || status === "UNPAID" || status === "WAITING_PAYMENT";

  const isStep2Done = ["CONFIRMED", "PROCESSING", "SHIPPING", "DELIVERED", "COMPLETED"].includes(status);
  const isStep2Current = status === "CONFIRMED" || status === "PROCESSING";

  const isStep3Done = ["SHIPPING", "DELIVERED", "COMPLETED"].includes(status);
  const isStep3Current = status === "SHIPPING";

  const isStep4Done = ["DELIVERED", "COMPLETED"].includes(status);
  const isStep4Current = isStep4Done;

  return [
    {
      title: "Đơn Hàng Đã Đặt",
      time: order.createdAt ? formatDate(order.createdAt) : "Vừa xong",
      done: isStep1Done,
      current: isStep1Current,
    },
    {
      title: "Chờ Shop Chuẩn Bị Hàng",
      time: isStep2Done ? (order.updatedAt ? formatDate(order.updatedAt) : "Đã xác nhận") : "Đang chờ xác nhận",
      done: isStep2Done,
      current: isStep2Current,
    },
    {
      title: "Đang Vận Chuyển",
      time: order.shippedAt ? formatDate(order.shippedAt) : isStep3Done ? "Đang giao hàng" : "Chờ giao hàng",
      done: isStep3Done,
      current: isStep3Current,
    },
    {
      title: "Giao Hàng Thành Công",
      time: order.deliveredAt ? formatDate(order.deliveredAt) : isStep4Done ? "Đã nhận hàng" : "Dự kiến 2-3 ngày",
      done: isStep4Done,
      current: isStep4Current,
    },
  ];
}

export default function OrderDetailPage() {
  const orderId = window.location.pathname.split("/orders/")[1] || "ord-1001";
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService
      .getOrderById(orderId)
      .then((data) => setOrder(data))
      .catch((err) => console.error("Load order detail failed:", err))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading || !order) {
    return (
      <div className="page-shell">
        <Header />
        <div className="container" style={{ padding: "40px 16px" }}>
          <div className="skeleton" style={{ width: "100%", height: "400px", borderRadius: "12px" }} />
        </div>
      </div>
    );
  }

  const statusInfo = ORDER_STATUS[order.orderStatus] || {
    label: order.orderStatus || "Chờ xác nhận",
    color: "var(--primary)",
  };

  const recipientName =
    order.shippingAddress?.fullName || order.recipient?.name || order.buyerId || "Người Nhận";
  const recipientPhone =
    order.shippingAddress?.phone || order.recipient?.phone || "0912 345 678";
  const recipientAddress =
    order.shippingAddress?.detail ||
    order.recipient?.address ||
    "Số 88 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh";

  const totalAmount = order.totalAmount || order.subtotal || 0;
  const shippingFee = order.shippingFee || 25000;
  const itemsSubtotal = (order.items || []).reduce(
    (sum, it) => sum + (it.unitPrice || it.price || 0) * (it.quantity || 1),
    0
  );

  const timelineSteps = buildOrderTimeline(order);

  return (
    <div className="page-shell">
      <Header />
      <SubNav />

      <main className="page-content">
        <div className="container" style={{ maxWidth: "960px" }}>
          {/* Back button & Title */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <a
              href="/orders"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "14px",
                fontWeight: "600",
                color: "var(--text-secondary)",
              }}
            >
              <ArrowLeft size={16} />
              <span>Trở Lại Danh Sách Đơn Hàng</span>
            </a>

            <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              <span>MÃ ĐƠN HÀNG: </span>
              <strong style={{ color: "var(--text)" }}>#{order.orderCode || order.id}</strong>
              <span style={{ margin: "0 8px" }}>|</span>
              <span
                style={{
                  color: statusInfo.color,
                  fontWeight: "700",
                  textTransform: "uppercase",
                }}
              >
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Timeline Card */}
          <div
            className="card"
            style={{
              padding: "24px",
              backgroundColor: "var(--surface)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--border-light)",
              marginBottom: "20px",
            }}
          >
            <OrderTimeline timeline={timelineSteps} />
          </div>

          {/* Delivery Address & Shipping Carrier Card */}
          <div
            className="card"
            style={{
              padding: "20px 24px",
              backgroundColor: "var(--surface)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--border-light)",
              marginBottom: "20px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
            }}
          >
            {/* Recipient info */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: "700",
                  fontSize: "14px",
                  color: "var(--text)",
                  marginBottom: "10px",
                }}
              >
                <MapPin size={16} color="var(--primary)" />
                <span>Địa Chỉ Nhận Hàng</span>
              </div>
              <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                <strong>{recipientName}</strong>
                <div>{recipientPhone}</div>
                <div style={{ color: "var(--text-secondary)" }}>
                  {recipientAddress}
                </div>
              </div>
            </div>

            {/* Carrier info */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: "700",
                  fontSize: "14px",
                  color: "var(--text)",
                  marginBottom: "10px",
                }}
              >
                <Truck size={16} color="var(--primary)" />
                <span>Thông Tin Vận Chuyển</span>
              </div>
              <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                <div>Đơn vị vận chuyển: <strong>{order.shippingProvider || "Giao Hàng Nhanh"}</strong></div>
                {order.trackingCode && (
                  <div style={{ color: "var(--text-secondary)" }}>
                    Mã vận đơn: <strong style={{ color: "var(--primary)" }}>{order.trackingCode}</strong>
                  </div>
                )}
                <div style={{ color: "#059669", fontSize: "12px", marginTop: "4px" }}>
                  {order.orderStatus === "SHIPPING" || order.orderStatus === "DELIVERED"
                    ? "✓ Đã được bàn giao cho đối tác vận chuyển"
                    : "⏳ Chờ shop xác nhận và chuẩn bị hàng"}
                </div>
              </div>
            </div>
          </div>

          {/* Product Items Table */}
          <div
            className="card"
            style={{
              padding: "20px 24px",
              backgroundColor: "var(--surface)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--border-light)",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                paddingBottom: "14px",
                borderBottom: "1px solid var(--border-light)",
                marginBottom: "16px",
              }}
            >
              <Store size={16} color="var(--primary)" />
              <strong style={{ fontSize: "15px" }}>{order.shop?.name || "Cửa Hàng DoMix Mall"}</strong>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {(order.items || []).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    paddingBottom: idx === order.items.length - 1 ? 0 : "14px",
                    borderBottom: idx === order.items.length - 1 ? "none" : "1px solid var(--border-light)",
                  }}
                >
                  <img
                    src={item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=140"}
                    alt={item.productName}
                    style={{
                      width: "70px",
                      height: "70px",
                      borderRadius: "6px",
                      objectFit: "cover",
                      border: "1px solid var(--border)",
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>
                      {item.productName || item.productId}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "3px" }}>
                      Phân loại: {item.variantName || item.variantSku || "Mặc định"}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "2px" }}>
                      Số lượng: x{item.quantity || 1}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--primary)" }}>
                      {formatCurrency((item.unitPrice || item.price || 0) * (item.quantity || 1))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Breakdown Card */}
          <div
            className="card"
            style={{
              padding: "20px 24px",
              backgroundColor: "var(--surface)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                <span>Tổng tiền hàng</span>
                <strong>{formatCurrency(itemsSubtotal || totalAmount)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                <span>Phí vận chuyển</span>
                <strong>{formatCurrency(shippingFee)}</strong>
              </div>
              {order.discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#059669" }}>
                  <span>Voucher giảm giá</span>
                  <strong>-{formatCurrency(order.discountAmount)}</strong>
                </div>
              )}
              <div style={{ height: "1px", backgroundColor: "var(--border-light)", margin: "4px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "15px", fontWeight: "700" }}>Tổng số tiền:</span>
                <strong style={{ fontSize: "22px", color: "var(--primary)", fontWeight: "900" }}>
                  {formatCurrency(totalAmount || itemsSubtotal + shippingFee)}
                </strong>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                Phương thức thanh toán: <strong>{order.paymentMethod || order.payment?.method || "Thanh toán khi nhận hàng (COD)"}</strong>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
