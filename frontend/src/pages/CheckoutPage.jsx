import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import SubNav from "../components/layout/SubNav";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import { orderService } from "../services/orderService";
import { useAuth } from "./Authcontext";
import { formatCurrency } from "../utils/formatters";
import { PAYMENT_METHODS, SHIPPING_PROVIDERS } from "../utils/constants";
import {
  MapPin,
  Truck,
  CreditCard,
  CheckCircle,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

export default function CheckoutPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [selectedShipping, setSelectedShipping] = useState(SHIPPING_PROVIDERS[1]); // GHN default
  const [paymentMethod, setPaymentMethod] = useState("VNPAY");
  const [orderNote, setOrderNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Address state
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [recipient, setRecipient] = useState({
    name: user?.fullName || "Nguyễn Minh Khang",
    phone: "0912 345 678",
    address: "Số 88 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
  });

  useEffect(() => {
    try {
      const storedItems = sessionStorage.getItem("checkout_items");
      const storedDiscount = sessionStorage.getItem("checkout_discount");
      if (storedItems) {
        setItems(JSON.parse(storedItems));
      }
      if (storedDiscount) {
        setDiscount(JSON.parse(storedDiscount));
      }
    } catch {
      setItems([]);
    }
  }, []);

  const itemsSubtotal = items.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  const shippingFee = selectedShipping?.price || 25000;
  const totalAmount = Math.max(0, itemsSubtotal + shippingFee - discount);

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      setErrorMsg("Không có sản phẩm nào trong đơn hàng!");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      const orderPayload = {
        userId: user?.userId || "guest",
        items,
        recipient,
        shippingProvider: selectedShipping.name,
        shippingFee,
        voucherDiscount: discount,
        totalAmount,
        paymentMethod,
        orderNote,
        orderStatus: paymentMethod === "COD" ? "PENDING" : "PENDING",
      };

      const createdOrder = await orderService.createOrder(orderPayload);

      // If VNPay, get payment redirect URL
      if (paymentMethod === "VNPAY") {
        const vnpayUrl = await orderService.createVNPayUrl(
          createdOrder.id || createdOrder.orderCode,
          totalAmount
        );
        window.location.href = vnpayUrl;
      } else {
        // COD order placed directly
        sessionStorage.removeItem("checkout_items");
        sessionStorage.removeItem("checkout_discount");
        window.location.href = `/orders/${createdOrder.id || createdOrder.orderCode}`;
      }
    } catch (err) {
      setErrorMsg(err.message || "Đặt hàng thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <Header />
      <SubNav />

      <main className="page-content">
        <div className="container">
          <h1 className="section-title" style={{ fontSize: "20px", marginBottom: "20px" }}>
            THANH TOÁN ĐƠN HÀNG
          </h1>

          {errorMsg && (
            <div
              style={{
                backgroundColor: "var(--error-bg)",
                border: "1px solid var(--error)",
                color: "var(--error-dark)",
                padding: "12px 16px",
                borderRadius: "var(--r-sm)",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 360px",
              gap: "24px",
              alignItems: "start",
            }}
          >
            {/* Left Col: Address, Items, Shipping, Payment */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Delivery Address Card */}
              <div
                className="card"
                style={{
                  padding: "20px",
                  backgroundColor: "var(--surface)",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--border-light)",
                  position: "relative",
                  borderTop: "3px solid var(--primary)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", fontSize: "15px", color: "var(--primary)" }}>
                    <MapPin size={18} />
                    <span>ĐỊA CHỈ NHẬN HÀNG</span>
                  </div>
                  <button
                    onClick={() => setAddressModalOpen(true)}
                    style={{
                      color: "var(--info)",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Thay đổi
                  </button>
                </div>

                <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
                  <strong>{recipient.name}</strong> ({recipient.phone})
                  <div style={{ color: "var(--text-secondary)", marginTop: "2px" }}>
                    {recipient.address}
                  </div>
                </div>
              </div>

              {/* Order Products List */}
              <div
                className="card"
                style={{
                  padding: "20px",
                  backgroundColor: "var(--surface)",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--border-light)",
                }}
              >
                <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "14px" }}>
                  Sản Phẩm Trong Đơn Hàng ({items.length})
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        paddingBottom: "12px",
                        borderBottom: idx === items.length - 1 ? "none" : "1px solid var(--border-light)",
                      }}
                    >
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120"}
                        alt={item.productName}
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "6px",
                          objectFit: "cover",
                          border: "1px solid var(--border)",
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.productName}
                        </div>
                        {item.variantSku && (
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            Phân loại: {item.variantSku}
                          </div>
                        )}
                        <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                          x{item.quantity}
                        </div>
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--primary)" }}>
                        {formatCurrency((item.price || 0) * (item.quantity || 1))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Note input */}
                <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border-light)" }}>
                  <input
                    type="text"
                    placeholder="Lời nhắn cho người bán (tùy chọn)..."
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: "13px",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-sm)",
                    }}
                  />
                </div>
              </div>

              {/* Shipping Method Option */}
              <div
                className="card"
                style={{
                  padding: "20px",
                  backgroundColor: "var(--surface)",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--border-light)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", fontSize: "15px", marginBottom: "14px" }}>
                  <Truck size={18} color="var(--primary)" />
                  <span>PHƯƠNG THỨC VẬN CHUYỂN</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {SHIPPING_PROVIDERS.map((prov) => (
                    <label
                      key={prov.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: "var(--r-sm)",
                        border: selectedShipping.id === prov.id ? "2px solid var(--primary)" : "1px solid var(--border)",
                        backgroundColor: selectedShipping.id === prov.id ? "var(--primary-light)" : "var(--surface)",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <input
                          type="radio"
                          name="shipping_provider"
                          checked={selectedShipping.id === prov.id}
                          onChange={() => setSelectedShipping(prov)}
                          style={{ accentColor: "var(--primary)" }}
                        />
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)" }}>
                            {prov.name}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            Dự kiến nhận hàng: {prov.estDays}
                          </div>
                        </div>
                      </div>
                      <strong style={{ fontSize: "13px", color: "var(--primary)" }}>
                        {formatCurrency(prov.price)}
                      </strong>
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div
                className="card"
                style={{
                  padding: "20px",
                  backgroundColor: "var(--surface)",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--border-light)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", fontSize: "15px", marginBottom: "14px" }}>
                  <CreditCard size={18} color="var(--primary)" />
                  <span>PHƯƠNG THỨC THANH TOÁN</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {Object.values(PAYMENT_METHODS).map((pm) => (
                    <label
                      key={pm.key}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        padding: "14px",
                        borderRadius: "var(--r-sm)",
                        border: paymentMethod === pm.key ? "2px solid var(--primary)" : "1px solid var(--border)",
                        backgroundColor: paymentMethod === pm.key ? "var(--primary-light)" : "var(--surface)",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === pm.key}
                        onChange={() => setPaymentMethod(pm.key)}
                        style={{ accentColor: "var(--primary)", marginTop: "3px" }}
                      />
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text)", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>{pm.icon}</span>
                          <span>{pm.label}</span>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                          {pm.desc}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Bill Summary Card */}
            <div
              className="card"
              style={{
                padding: "20px",
                backgroundColor: "var(--surface)",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--border-light)",
                position: "sticky",
                top: "calc(var(--topbar-h) + 16px)",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "16px" }}>
                CHI TIẾT THANH TOÁN
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                  <span>Tổng tiền hàng:</span>
                  <strong style={{ color: "var(--text)" }}>{formatCurrency(itemsSubtotal)}</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                  <span>Phí vận chuyển:</span>
                  <strong style={{ color: "var(--text)" }}>{formatCurrency(shippingFee)}</strong>
                </div>

                {discount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#059669", fontWeight: "600" }}>
                    <span>Giảm giá voucher:</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}

                <div style={{ height: "1px", backgroundColor: "var(--border-light)", margin: "6px 0" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700" }}>Tổng thanh toán:</span>
                  <strong style={{ fontSize: "22px", color: "var(--primary)", fontWeight: "900" }}>
                    {formatCurrency(totalAmount)}
                  </strong>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                block
                loading={loading}
                onClick={handlePlaceOrder}
                style={{ marginTop: "20px" }}
              >
                {paymentMethod === "VNPAY" ? "Thanh Toán Qua VNPAY" : "Đặt Hàng (COD)"}
              </Button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  marginTop: "14px",
                }}
              >
                <ShieldCheck size={14} color="#059669" />
                <span>Bảo vệ quyền lợi người mua 100% bởi DoMix</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Change Address Modal */}
      <Modal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        title="Địa Chỉ Nhận Hàng"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
              Họ và Tên Người Nhận
            </label>
            <input
              type="text"
              value={recipient.name}
              onChange={(e) => setRecipient({ ...recipient, name: e.target.value })}
              style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
              Số Điện Thoại
            </label>
            <input
              type="text"
              value={recipient.phone}
              onChange={(e) => setRecipient({ ...recipient, phone: e.target.value })}
              style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
              Địa Chỉ Chi Tiết
            </label>
            <textarea
              rows={3}
              value={recipient.address}
              onChange={(e) => setRecipient({ ...recipient, address: e.target.value })}
              style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px" }}
            />
          </div>
          <Button variant="primary" block onClick={() => setAddressModalOpen(false)}>
            Xác Nhận Địa Chỉ
          </Button>
        </div>
      </Modal>

      <Footer />
      <MobileNav />
    </div>
  );
}
