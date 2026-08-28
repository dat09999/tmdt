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
    label: order.orderStatus || "Đang xử lý",
    color: "var(--primary)",
  };

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
            <OrderTimeline timeline={order.timeline || []} />
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
                <strong>{order.recipient?.name || "Nguyễn Minh Khang"}</strong>
                <div>{order.recipient?.phone || "0912 345 678"}</div>
                <div style={{ color: "var(--text-secondary)" }}>
                  {order.recipient?.address || "Số 88 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"}
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
                  ✓ Đã được bàn giao cho đối tác vận chuyển
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
                      Số lượng: x{item.quantity}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--primary)" }}>
                      {formatCurrency((item.price || 0) * (item.quantity || 1))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Breakdown & Actions */}
          <div
            className="card"
            style={{
              padding: "24px",
              backgroundColor: "var(--surface)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--border-light)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-secondary)" }}>
              <span>Tổng tiền hàng:</span>
              <strong style={{ color: "var(--text)" }}>{formatCurrency(order.itemsSubtotal || order.totalAmount)}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-secondary)" }}>
              <span>Phí vận chuyển:</span>
              <strong style={{ color: "var(--text)" }}>{formatCurrency(order.shippingFee || 25000)}</strong>
            </div>

            {order.voucherDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#059669" }}>
                <span>Giảm giá voucher:</span>
                <span>-{formatCurrency(order.voucherDiscount)}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-secondary)" }}>
              <span>Phương thức thanh toán:</span>
              <strong>{order.paymentMethod === "VNPAY" ? "Cổng VNPAY (Đã thanh toán)" : "Thanh toán khi nhận hàng (COD)"}</strong>
            </div>

            <div style={{ height: "1px", backgroundColor: "var(--border-light)", margin: "4px 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "15px", fontWeight: "700" }}>Tổng số tiền:</span>
              <strong style={{ fontSize: "24px", color: "var(--primary)", fontWeight: "900" }}>
                {formatCurrency(order.totalAmount || 0)}
              </strong>
            </div>

            {/* Actions bottom bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "16px",
                paddingTop: "16px",
                borderTop: "1px solid var(--border-light)",
              }}
            >
              <Button
                variant="outline"
                icon={RotateCcw}
                onClick={() => (window.location.href = `/refunds?orderId=${order.id}`)}
              >
                Yêu Cầu Trả Hàng / Hoàn Tiền
              </Button>
              <Button
                variant="primary"
                onClick={() => (window.location.href = "/products")}
              >
                Mua Lại
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
