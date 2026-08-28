import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import SubNav from "../components/layout/SubNav";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import AddressAutocomplete from "../components/common/AddressAutocomplete";
import { orderService } from "../services/orderService";
import { userService } from "../services/userService";
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
  Plus,
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

  // Saved Addresses state
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addresses, setAddresses] = useState([
    {
      id: "addr-1",
      name: user?.fullName || "Nguyễn Minh Khang",
      phone: "0912 345 678",
      address: "Số 88 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
      isDefault: true,
      type: "Nhà Riêng",
    },
    {
      id: "addr-2",
      name: (user?.fullName || "Nguyễn Minh Khang") + " (Văn Phòng)",
      phone: "0912 345 678",
      address: "Tòa nhà Bitexco, Số 2 Hải Triều, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
      isDefault: false,
      type: "Văn Phòng",
    },
  ]);
  const [selectedAddressId, setSelectedAddressId] = useState("addr-1");
  const [tempSelectedId, setTempSelectedId] = useState("addr-1");

  // New Address form inside checkout modal
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAddrForm, setNewAddrForm] = useState({
    name: user?.fullName || "",
    phone: "",
    address: "",
    type: "Nhà Riêng",
    lat: null,
    lng: null,
    isDefault: false,
  });

  // Fetch real addresses of user from API
  useEffect(() => {
    if (!user?.userId) return;
    userService.getUserProfile(user.userId).then((profile) => {
      if (profile && Array.isArray(profile.address) && profile.address.length > 0) {
        const mapped = profile.address.map((a, idx) => ({
          id: a.id || `addr-${idx}`,
          name: a.fullName || profile.fullName || "Người Nhận",
          phone: a.phone || profile.phone || "0912 345 678",
          address: a.detail || `${a.ward || ""}, ${a.district || ""}, ${a.province || ""}`.trim(),
          isDefault: !!a.isDefault,
          lat: a.lat,
          lng: a.lng,
          type: "Nhà Riêng",
        }));
        setAddresses(mapped);
        const defaultAddr = mapped.find((a) => a.isDefault) || mapped[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          setTempSelectedId(defaultAddr.id);
        }
      }
    });
  }, [user?.userId]);

  const currentAddress =
    addresses.find((a) => a.id === selectedAddressId) || addresses[0];

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
        buyerId: user?.userId || "guest",
        shippingAddress: {
          fullName: currentAddress?.name || "Người Nhận",
          phone: currentAddress?.phone || "0912345678",
          detail: currentAddress?.address || "",
          province: currentAddress?.province || "",
          district: currentAddress?.district || "",
          ward: currentAddress?.ward || "",
          lat: currentAddress?.lat || null,
          lng: currentAddress?.lng || null,
          isDefault: !!currentAddress?.isDefault,
        },
        selectedItems: items.map((item) => ({
          productId: item.productId,
          variantSku: item.variantSku || "default",
        })),
        couponCode: discount > 0 ? "DOMIX50K" : "",
        note: orderNote,
        paymentMethod,
      };

      const createdOrders = await orderService.createOrderFromCart(orderPayload);
      const ordersList = Array.isArray(createdOrders) ? createdOrders : [createdOrders];
      const primaryOrder = ordersList[0];

      // If VNPay, get payment redirect URL
      if (paymentMethod === "VNPAY") {
        const vnpayUrl = await orderService.createVNPayUrl(
          primaryOrder.id || primaryOrder.orderCode
        );
        window.location.href = vnpayUrl;
      } else {
        // COD order placed directly
        sessionStorage.removeItem("checkout_items");
        sessionStorage.removeItem("checkout_discount");
        window.location.href = `/orders/${primaryOrder.id || primaryOrder.orderCode}`;
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
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <strong>{currentAddress?.name}</strong>
                    <span style={{ color: "var(--text-tertiary)" }}>|</span>
                    <span style={{ color: "var(--text)" }}>{currentAddress?.phone}</span>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "1px 6px",
                        borderRadius: "3px",
                        backgroundColor: "var(--surface-muted)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {currentAddress?.type || "Nhà Riêng"}
                    </span>
                    {currentAddress?.isDefault && (
                      <span
                        style={{
                          fontSize: "11px",
                          backgroundColor: "var(--primary)",
                          color: "#fff",
                          padding: "1px 6px",
                          borderRadius: "3px",
                          fontWeight: "700",
                        }}
                      >
                        Mặc định
                      </span>
                    )}
                  </div>
                  <div style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
                    {currentAddress?.address}
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

      {/* Change Address Modal - Shopee Style */}
      <Modal
        isOpen={addressModalOpen}
        onClose={() => {
          setAddressModalOpen(false);
          setIsAddingNew(false);
          setTempSelectedId(selectedAddressId);
        }}
        title="Địa Chỉ Của Tôi"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {!isAddingNew ? (
            <>
              {/* Address List */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  maxHeight: "360px",
                  overflowY: "auto",
                }}
              >
                {addresses.map((addr) => {
                  const isSelected = tempSelectedId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setTempSelectedId(addr.id)}
                      style={{
                        padding: "14px",
                        borderRadius: "var(--r-md)",
                        border: isSelected
                          ? "1.5px solid var(--primary)"
                          : "1px solid var(--border)",
                        backgroundColor: isSelected
                          ? "var(--primary-subtle)"
                          : "var(--surface)",
                        cursor: "pointer",
                        display: "flex",
                        gap: "12px",
                        alignItems: "flex-start",
                        transition: "all 0.15s",
                      }}
                    >
                      <input
                        type="radio"
                        name="selectedAddress"
                        checked={isSelected}
                        onChange={() => setTempSelectedId(addr.id)}
                        style={{ marginTop: "4px", accentColor: "var(--primary)" }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "4px",
                            flexWrap: "wrap",
                          }}
                        >
                          <strong style={{ fontSize: "14px" }}>{addr.name}</strong>
                          <span style={{ color: "var(--text-tertiary)" }}>|</span>
                          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                            {addr.phone}
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "1px 6px",
                              borderRadius: "3px",
                              backgroundColor: "var(--surface-muted)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            {addr.type || "Nhà Riêng"}
                          </span>
                          {addr.isDefault && (
                            <span
                              style={{
                                fontSize: "11px",
                                backgroundColor: "var(--primary)",
                                color: "#fff",
                                padding: "1px 6px",
                                borderRadius: "3px",
                                fontWeight: "700",
                              }}
                            >
                              Mặc định
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                            lineHeight: "1.4",
                          }}
                        >
                          {addr.address}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add New Address Button */}
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px",
                  border: "1px dashed var(--primary)",
                  borderRadius: "var(--r-sm)",
                  color: "var(--primary)",
                  backgroundColor: "var(--primary-light)",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <Plus size={16} />
                <span>Thêm Địa Chỉ Mới</span>
              </button>

              {/* Modal Actions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "8px",
                  paddingTop: "12px",
                  borderTop: "1px solid var(--border-light)",
                }}
              >
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setAddressModalOpen(false);
                    setTempSelectedId(selectedAddressId);
                  }}
                >
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setSelectedAddressId(tempSelectedId);
                    setAddressModalOpen(false);
                  }}
                >
                  Xác Nhận
                </Button>
              </div>
            </>
          ) : (
            /* Inline Add New Address Form */
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newAddrForm.name || !newAddrForm.phone || !newAddrForm.address) {
                  return;
                }
                const newId = `addr-${Date.now()}`;
                const newAddrItem = {
                  id: newId,
                  name: newAddrForm.name,
                  phone: newAddrForm.phone,
                  address: newAddrForm.address,
                  type: newAddrForm.type,
                  lat: newAddrForm.lat,
                  lng: newAddrForm.lng,
                  isDefault: newAddrForm.isDefault || addresses.length === 0,
                };

                // Call backend API if user logged in
                if (user?.userId) {
                  await userService.addAddress(user.userId, {
                    fullName: newAddrForm.name,
                    phone: newAddrForm.phone,
                    detail: newAddrForm.address,
                    lat: newAddrForm.lat,
                    lng: newAddrForm.lng,
                    isDefault: !!newAddrForm.isDefault,
                  });
                }

                setAddresses([newAddrItem, ...addresses]);
                setSelectedAddressId(newId);
                setTempSelectedId(newId);
                setIsAddingNew(false);
                setNewAddrForm({
                  name: user?.fullName || "",
                  phone: "",
                  address: "",
                  type: "Nhà Riêng",
                  lat: null,
                  lng: null,
                  isDefault: false,
                });
              }}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Họ và Tên Người Nhận
                </label>
                <input
                  type="text"
                  value={newAddrForm.name}
                  onChange={(e) =>
                    setNewAddrForm({ ...newAddrForm, name: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                  }}
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Số Điện Thoại
                </label>
                <input
                  type="tel"
                  value={newAddrForm.phone}
                  onChange={(e) =>
                    setNewAddrForm({ ...newAddrForm, phone: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                  }}
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Địa Chỉ Chi Tiết (Tìm kiếm & gợi ý bản đồ)
                </label>
                <AddressAutocomplete
                  value={newAddrForm.address}
                  onChange={(val) =>
                    setNewAddrForm((prev) => ({ ...prev, address: val }))
                  }
                  onPlaceSelect={(place) => {
                    setNewAddrForm((prev) => ({
                      ...prev,
                      address: place.formattedAddress || place.detail,
                      lat: place.lat,
                      lng: place.lng,
                    }));
                  }}
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Loại Địa Chỉ
                </label>
                <select
                  value={newAddrForm.type}
                  onChange={(e) =>
                    setNewAddrForm({ ...newAddrForm, type: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    backgroundColor: "#fff",
                  }}
                >
                  <option value="Nhà Riêng">Nhà Riêng</option>
                  <option value="Văn Phòng">Văn Phòng / Công Ty</option>
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "8px",
                }}
              >
                <Button
                  variant="outline"
                  size="md"
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                >
                  Quay Lại
                </Button>
                <Button variant="primary" size="md" type="submit">
                  Lưu & Chọn Địa Chỉ
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      <Footer />
      <MobileNav />
    </div>
  );
}
