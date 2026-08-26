import { useEffect, useState } from "react";
import { API_BASE_URL, authFetch } from "../utils/auth";
import { useAuth } from "./Authcontext";
import Header from "../components/Header";
import "./CheckoutPage.css";

const initialAddress = { fullName: "", phone: "", province: "", district: "", ward: "", detail: "", isDefault: false };
const itemKey = (item) => `${item.productId}__${item.variantSku || ""}`;

export default function CheckoutPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [shippingAddress, setShippingAddress] = useState(initialAddress);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [couponCode, setCouponCode] = useState(sessionStorage.getItem("checkoutCouponCode") || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user?.userId) { window.location.href = "/login"; return; }
    const rawSelection = sessionStorage.getItem("checkoutSelectedItems");
    if (!rawSelection) {
      setMessage("Không có sản phẩm được chọn. Vui lòng quay lại giỏ hàng.");
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const selected = JSON.parse(rawSelection);
        const selectedKeys = new Set(selected.map(itemKey));
        const cart = await authFetch(`${API_BASE_URL}/cart/${user.userId}`);
        setItems((cart.items || []).filter(item => selectedKeys.has(itemKey(item))));
      } catch (err) {
        setMessage(err.message || "Không tải được sản phẩm đã chọn");
      } finally { setLoading(false); }
    })();
  }, []);

  const startNextVnpayPayment = async (orderIds) => {
    const [nextOrderId, ...remaining] = orderIds;
    sessionStorage.setItem("pendingVnpayOrderIds", JSON.stringify(remaining));
    const data = await authFetch(`${API_BASE_URL}/api/payment/vnpay/create/${nextOrderId}`, { method: "POST" });
    if (!data?.paymentUrl) throw new Error("Backend không trả về URL thanh toán VNPay.");
    window.location.href = data.paymentUrl;
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    if (!items.length) { setMessage("Không có sản phẩm nào được chọn."); return; }
    if (Object.entries(shippingAddress)
      .filter(([field]) => field !== "isDefault")
      .some(([, value]) => !String(value).trim())) {
      setMessage("Vui lòng nhập đầy đủ địa chỉ giao hàng.");
      return;
    }
    try {
      setLoading(true);
      const selectedItems = items.map(({ productId, variantSku }) => ({ productId, variantSku }));
      const orders = await authFetch(`${API_BASE_URL}/orders/from-cart`, {
        method: "POST",
        body: JSON.stringify({
          buyerId: user.userId,
          selectedItems,
          shippingAddress,
          paymentMethod,
          couponCode: couponCode.trim() || null
        }),
      });
      sessionStorage.removeItem("checkoutSelectedItems");
      sessionStorage.removeItem("checkoutCouponCode");

      if (paymentMethod === "VNPAY") {
        const orderIds = (Array.isArray(orders) ? orders : [orders])
          .map(order => order.id || order._id)
          .filter(Boolean);
        if (!orderIds.length) throw new Error("Không nhận được mã đơn hàng để tạo thanh toán.");
        await startNextVnpayPayment(orderIds);
        return;
      }

      sessionStorage.setItem("orderSuccessMessage",
        `Đặt hàng thành công cho ${Array.isArray(orders) ? orders.length : 1} shop.`);
      window.location.href = "/orders";
    } catch (err) {
      setMessage(err.message || "Không thể tạo đơn hàng.");
      setLoading(false);
    }
  };

  const addr = (field, value) => setShippingAddress(previous => ({ ...previous, [field]: value }));
  const totalPrice = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const paymentOptions = [
    { id:"COD", icon:"🏠", label:"Thanh toán khi nhận hàng (COD)", sub:"Trả tiền mặt khi nhận hàng" },
    { id:"VNPAY", icon:"💳", label:"VNPAY", sub:"Thanh toán lần lượt cho từng shop" },
  ];

  return (
    <div className="checkout-page">
      <Header />
      <div className="checkout-body">
        <div className="checkout-breadcrumb"><a href="/">Trang chủ</a>›<a href="/cart">Giỏ hàng</a>›<span>Thanh toán</span></div>
        {message && <div className="checkout-message">{message}</div>}
        {loading && !items.length ? <div className="checkout-empty">Đang tải...</div> : !items.length ? (
          <div className="checkout-empty"><a href="/cart">Quay lại giỏ hàng để chọn sản phẩm</a></div>
        ) : (
          <>
            <form className="checkout-form-card" onSubmit={handleSubmit}>
              <h2>Địa chỉ giao hàng</h2>
              <div className="checkout-form">
                <div className="form-row-2">
                  <div className="form-field"><label>Họ và tên *</label><input value={shippingAddress.fullName} onChange={e => addr("fullName", e.target.value)} required /></div>
                  <div className="form-field"><label>Số điện thoại *</label><input value={shippingAddress.phone} onChange={e => addr("phone", e.target.value)} required /></div>
                </div>
                <div className="form-row-2">
                  <div className="form-field"><label>Tỉnh / Thành phố *</label><input value={shippingAddress.province} onChange={e => addr("province", e.target.value)} required /></div>
                  <div className="form-field"><label>Quận / Huyện *</label><input value={shippingAddress.district} onChange={e => addr("district", e.target.value)} required /></div>
                </div>
                <div className="form-field"><label>Phường / Xã *</label><input value={shippingAddress.ward} onChange={e => addr("ward", e.target.value)} required /></div>
                <div className="form-field"><label>Địa chỉ chi tiết *</label><textarea value={shippingAddress.detail} onChange={e => addr("detail", e.target.value)} required /></div>
                <h2>Phương thức thanh toán</h2>
                <div className="payment-options">
                  {paymentOptions.map(option => (
                    <label key={option.id} className={`payment-option${paymentMethod === option.id ? " selected" : ""}`}>
                      <input type="radio" name="payment" checked={paymentMethod === option.id} onChange={() => setPaymentMethod(option.id)} />
                      <span className="payment-option-icon">{option.icon}</span>
                      <span><div className="payment-option-label">{option.label}</div><div className="payment-option-sub">{option.sub}</div></span>
                    </label>
                  ))}
                </div>
                <h2>Mã giảm giá</h2>
                <div className="voucher-row"><input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Nhập mã voucher..." /></div>
              </div>
            </form>

            <div className="checkout-summary-card">
              <h3>Đơn hàng ({items.length} sản phẩm)</h3>
              <div className="checkout-items">
                {items.map(item => (
                  <div key={itemKey(item)} className="checkout-item">
                    <img src={item.image || "https://via.placeholder.com/48"} alt={item.productName} />
                    <div className="checkout-item-info"><div className="checkout-item-name">{item.productName}</div><div className="checkout-item-qty">x{item.quantity}</div></div>
                    <span className="checkout-item-price">{((item.price || 0) * item.quantity).toLocaleString()}đ</span>
                  </div>
                ))}
              </div>
              <div className="summary-line total"><span>Tổng cộng</span><span>{totalPrice.toLocaleString()}đ</span></div>
              <button type="button" className="btn-primary checkout-submit-btn" onClick={handleSubmit} disabled={loading}>
                {loading ? "Đang xử lý..." : "🎉 Đặt hàng ngay"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
