import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import SubNav from "../components/layout/SubNav";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import OrderTimeline from "../components/order/OrderTimeline";
import { orderService } from "../services/orderService";
import { formatCurrency, formatDate } from "../utils/formatters";
import { ORDER_STATUS } from "../utils/constants";
import {
  ArrowLeft,
  MapPin,
  Truck,
  Store,
  CreditCard,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Package,
} from "lucide-react";

function buildOrderTimeline(order) {
  if (!order) return [];

  const status = (order.orderStatus || "").toUpperCase();

  // If order was cancelled
  if (status === "CANCELED" || status === "CANCELLED") {
    return [
      {
        title: "Đơn Hàng Đã Đặt",
        time: order.createdAt ? formatDate(order.createdAt, true) : "Vừa xong",
        done: true,
        current: false,
      },
      {
        title: "Đơn Hàng Đã Bị Hủy",
        time: order.updatedAt ? formatDate(order.updatedAt, true) : "Đã hủy",
        done: true,
        current: true,
        isCancelled: true,
        note: order.cancelReason || "Đơn hàng đã bị hủy",
      },
    ];
  }

  const isStep1Done = true;
  const isStep1Current = status === "PENDING";

  const isStep2Done = ["PROCESSING", "SHIPPING", "DELIVERED", "COMPLETED"].includes(status);
  const isStep2Current = status === "PROCESSING";

  const isStep3Done = ["SHIPPING", "DELIVERED", "COMPLETED"].includes(status);
  const isStep3Current = status === "SHIPPING";

  const isStep4Done = ["DELIVERED", "COMPLETED"].includes(status);
  const isStep4Current = isStep4Done;

  return [
    {
      title: "Đơn Hàng Đã Đặt",
      time: order.createdAt ? formatDate(order.createdAt, true) : "Vừa xong",
      done: isStep1Done,
      current: isStep1Current,
    },
    {
      title: "Chờ Shop Chuẩn Bị Hàng",
      time: isStep2Done ? (order.updatedAt ? formatDate(order.updatedAt, true) : "Đã xác nhận") : "Đang chờ xác nhận",
      done: isStep2Done,
      current: isStep2Current,
    },
    {
      title: "Đang Vận Chuyển",
      time: order.shippedAt ? formatDate(order.shippedAt, true) : isStep3Done ? "Đang giao hàng" : "Chờ bàn giao",
      done: isStep3Done,
      current: isStep3Current,
    },
    {
      title: "Giao Hàng Thành Công",
      time: order.deliveredAt ? formatDate(order.deliveredAt, true) : isStep4Done ? "Đã nhận hàng" : "Dự kiến 2-3 ngày",
      done: isStep4Done,
      current: isStep4Current,
    },
  ];
}

export default function OrderDetailPage() {
  const orderId = window.location.pathname.split("/orders/")[1] || "";
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    orderService
      .getOrderById(orderId)
      .then((data) => setOrder(data))
      .catch((err) => {
        console.error("Load order detail failed:", err);
        setOrder(null);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="page-shell">
        <Header />
        <div className="container" style={{ padding: "40px 16px" }}>
          <div className="skeleton" style={{ width: "100%", height: "400px", borderRadius: "12px" }} />
        </div>
      </div>
    );
  }

  // If order is not found in database
  if (!order) {
    return (
      <div className="page-shell">
        <Header />
        <SubNav />
        <main className="page-content">
          <div className="container" style={{ maxWidth: "860px", padding: "60px 16px", textAlign: "center" }}>
            <EmptyState
              icon={Package}
              title="Không Tìm Thấy Đơn Hàng"
              description={`Đơn hàng mã #${orderId} không tồn tại trong hệ thống hoặc bạn không có quyền truy cập.`}
              actionText="Quay lại danh sách đơn mua"
              onAction={() => (window.location.href = "/orders")}
            />
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  const statusInfo = ORDER_STATUS[order.orderStatus] || {
    label: order.orderStatus || "Chờ xác nhận",
    color: "var(--primary)",
  };

  const recipientName =
    order.shippingAddress?.fullName || order.recipient?.name || order.buyerId || "Khách Hàng";
  const recipientPhone =
    order.shippingAddress?.phone || order.recipient?.phone || "Chưa có SĐT";

  const recipientAddress = order.shippingAddress
    ? typeof order.shippingAddress === "string"
      ? order.shippingAddress
      : [
          order.shippingAddress.detail,
          order.shippingAddress.ward,
          order.shippingAddress.district,
          order.shippingAddress.province,
        ]
          .filter(Boolean)
          .join(", ")
    : order.recipient?.address || "Chưa có thông tin địa chỉ giao hàng";

  const totalAmount = order.totalAmount || order.subtotal || 0;
  const shippingFee = order.shippingFee !== undefined ? order.shippingFee : 30000;
  const discountAmount = order.discountAmount || 0;
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
              flexWrap: "wrap",
              gap: "10px",
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
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
                <div style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
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
                <div>Đơn vị vận chuyển: <strong>{order.shippingProvider || "Giao Hàng Nhanh (GHN)"}</strong></div>
                {order.trackingCode && (
                  <div style={{ color: "var(--text-secondary)" }}>
                    Mã vận đơn: <strong style={{ color: "var(--primary)" }}>{order.trackingCode}</strong>
                  </div>
                )}
                <div style={{ color: "#059669", fontSize: "12px", marginTop: "4px", fontWeight: "600" }}>
                  {order.orderStatus === "SHIPPING"
                    ? "🚚 Đang trên đường giao đến bạn"
                    : order.orderStatus === "DELIVERED"
                    ? "✓ Giao hàng thành công"
                    : order.orderStatus === "CANCELED"
                    ? "✕ Đơn hàng đã hủy"
                    : "⏳ Người bán đang chuẩn bị hàng"}
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
              <strong style={{ fontSize: "15px" }}>
                {order.shop?.name || order.shopName || (order.shopId ? `Gian Hàng #${order.shopId}` : "Cửa Hàng DoMix")}
              </strong>
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
                      {formatCurrency((item.unitPrice || item.price || (item.totalPrice ? item.totalPrice / (item.quantity || 1) : 0)) * (item.quantity || 1))}
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
                <strong>{formatCurrency(itemsSubtotal || order.subtotal || totalAmount)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                <span>Phí vận chuyển</span>
                <strong>{formatCurrency(shippingFee)}</strong>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--primary)" }}>
                  <span>Giảm giá Voucher {order.couponCode ? `(${order.couponCode})` : ""}</span>
                  <strong>-{formatCurrency(discountAmount)}</strong>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "16px",
                  paddingTop: "12px",
                  borderTop: "1px dashed var(--border)",
                  marginTop: "6px",
                }}
              >
                <strong>Thành tiền:</strong>
                <strong style={{ color: "var(--primary)", fontSize: "20px", fontWeight: "900" }}>
                  {formatCurrency(totalAmount)}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-tertiary)", fontSize: "12px", marginTop: "4px" }}>
                <span>Phương thức thanh toán:</span>
                <span>{order.payment?.method === "COD" ? "Thanh toán khi nhận hàng (COD)" : order.payment?.method || "VNPAY"}</span>
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                marginTop: "20px",
                paddingTop: "16px",
                borderTop: "1px solid var(--border-light)",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              {order.orderStatus === "DELIVERED" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => (window.location.href = `/refunds?orderId=${order.id}`)}
                  >
                    <RotateCcw size={16} />
                    <span>Yêu Cầu Trả Hàng / Hoàn Tiền</span>
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      const firstProdId = order.items?.[0]?.productId || "sp-01";
                      window.location.href = `/product/${firstProdId}#reviews`;
                    }}
                  >
                    Đánh Giá Sản Phẩm
                  </Button>
                </>
              )}
              <Button
                variant="secondary"
                onClick={() => (window.location.href = "/orders")}
              >
                Quay Lại Đơn Mua
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
