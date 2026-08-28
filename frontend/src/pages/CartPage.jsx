import React, { useState, useEffect, useMemo } from "react";
import Header from "../components/layout/Header";
import SubNav from "../components/layout/SubNav";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import CartShopGroup from "../components/cart/CartShopGroup";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import { cartService } from "../services/cartService";
import { useAuth } from "./Authcontext";
import { formatCurrency } from "../utils/formatters";
import { ShoppingBag, ArrowRight, Tag, ShieldCheck, Trash2 } from "lucide-react";

export default function CartPage() {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [toastMessage, setToastMessage] = useState("");

  const itemKey = (item) => `${item.productId}__${item.variantSku || ""}`;

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await cartService.getCart(user?.userId);
      setCart(data || { items: [] });
      // Select all by default
      const keys = new Set((data?.items || []).map(itemKey));
      setSelectedKeys(keys);
    } catch (err) {
      console.error("Fetch cart error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user?.userId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Group items by shop
  const groupedItems = useMemo(() => {
    return (cart?.items || []).reduce((groups, item) => {
      const shopId = item.shopId || "shop-official";
      if (!groups[shopId]) {
        groups[shopId] = {
          shopId,
          shopName: item.shopName || "Cửa Hàng Chính Hãng",
          items: [],
        };
      }
      groups[shopId].items.push(item);
      return groups;
    }, {});
  }, [cart]);

  const allItems = cart?.items || [];
  const selectedItems = allItems.filter((i) => selectedKeys.has(itemKey(i)));

  const subtotal = selectedItems.reduce(
    (sum, i) => sum + (i.price || 0) * (i.quantity || 1),
    0
  );

  const totalAmount = Math.max(0, subtotal - appliedDiscount);

  const allSelected = allItems.length > 0 && selectedItems.length === allItems.length;

  const handleToggleSelectAll = (checked) => {
    if (checked) {
      setSelectedKeys(new Set(allItems.map(itemKey)));
    } else {
      setSelectedKeys(new Set());
    }
  };

  const handleSelectItem = (item, checked) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      const k = itemKey(item);
      checked ? next.add(k) : next.delete(k);
      return next;
    });
  };

  const handleSelectShop = (shopItems, checked) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      shopItems.forEach((item) => {
        const k = itemKey(item);
        checked ? next.add(k) : next.delete(k);
      });
      return next;
    });
  };

  const handleQuantityChange = async (item, newQty) => {
    await cartService.updateQuantity(user?.userId, {
      productId: item.productId,
      variantSku: item.variantSku,
      quantity: newQty,
    });
    await fetchCart();
  };

  const handleRemoveItem = async (item) => {
    await cartService.removeItem(user?.userId, item);
    showToast("Đã xóa sản phẩm khỏi giỏ hàng");
    await fetchCart();
  };

  const handleDeleteSelected = async () => {
    for (const item of selectedItems) {
      await cartService.removeItem(user?.userId, item);
    }
    showToast(`Đã xóa ${selectedItems.length} sản phẩm`);
    await fetchCart();
  };

  const handleApplyVoucher = (e) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;
    if (voucherCode.toUpperCase() === "DOMIX50K") {
      setAppliedDiscount(50000);
      showToast("Áp dụng mã giảm giá 50.000₫ thành công!");
    } else if (voucherCode.toUpperCase() === "FREESHIP") {
      setAppliedDiscount(25000);
      showToast("Áp dụng mã miễn phí vận chuyển 25.000₫ thành công!");
    } else {
      showToast("Mã giảm giá không hợp lệ hoặc đã hết hạn");
    }
  };

  const handleProceedCheckout = () => {
    if (selectedItems.length === 0) {
      showToast("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
      return;
    }
    // Save selected items in session storage for checkout page
    sessionStorage.setItem("checkout_items", JSON.stringify(selectedItems));
    sessionStorage.setItem("checkout_discount", JSON.stringify(appliedDiscount));
    window.location.href = "/checkout";
  };

  return (
    <div className="page-shell">
      <Header />
      <SubNav />

      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            right: "20px",
            zIndex: 9999,
            backgroundColor: "var(--text)",
            color: "#ffffff",
            padding: "10px 18px",
            borderRadius: "var(--r-md)",
            fontSize: "13px",
            fontWeight: "600",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {toastMessage}
        </div>
      )}

      <main className="page-content">
        <div className="container">
          <div className="section-header" style={{ marginBottom: "20px" }}>
            <h1 className="section-title" style={{ fontSize: "20px" }}>
              GIỎ HÀNG CỦA BẠN ({allItems.length} sản phẩm)
            </h1>
          </div>

          {allItems.length === 0 && !loading ? (
            <EmptyState
              icon={ShoppingBag}
              title="Giỏ hàng của bạn đang trống"
              description="Hãy khám phá hàng ngàn sản phẩm chất lượng giá tốt trên DoMix nhé!"
              actionText="Khám phá ngay"
              onAction={() => (window.location.href = "/products")}
            />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 340px",
                gap: "24px",
                alignItems: "start",
              }}
            >
              {/* Left Column: Cart items table */}
              <div>
                {/* Select all bar */}
                <div
                  className="card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    marginBottom: "16px",
                    backgroundColor: "var(--surface)",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "14px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleToggleSelectAll(e.target.checked)}
                      style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }}
                    />
                    <span>Chọn tất cả ({allItems.length} sản phẩm)</span>
                  </label>

                  {selectedItems.length > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "13px",
                        color: "var(--error)",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={15} />
                      <span>Xóa mục đã chọn ({selectedItems.length})</span>
                    </button>
                  )}
                </div>

                {/* Groups by Shop */}
                {Object.values(groupedItems).map((group) => (
                  <CartShopGroup
                    key={group.shopId}
                    shopId={group.shopId}
                    shopName={group.shopName}
                    items={group.items}
                    selectedKeys={selectedKeys}
                    onSelectItem={handleSelectItem}
                    onSelectShop={handleSelectShop}
                    onQuantityChange={handleQuantityChange}
                    onRemoveItem={handleRemoveItem}
                  />
                ))}
              </div>

              {/* Right Column: Order Summary & Voucher */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Voucher Box */}
                <div
                  className="card"
                  style={{
                    padding: "18px",
                    backgroundColor: "var(--surface)",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", marginBottom: "12px" }}>
                    <Tag size={16} color="var(--primary)" />
                    <span>MÃ GIẢM GIÁ / VOUCHER</span>
                  </div>
                  <form onSubmit={handleApplyVoucher} style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="Nhập mã DOMIX50K / FREESHIP"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        fontSize: "13px",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--r-sm)",
                        textTransform: "uppercase",
                      }}
                    />
                    <Button variant="secondary" size="sm" type="submit">
                      Áp Dụng
                    </Button>
                  </form>
                </div>

                {/* Summary Card */}
                <div
                  className="card"
                  style={{
                    padding: "20px",
                    backgroundColor: "var(--surface)",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "16px", color: "var(--text)" }}>
                    TỔNG ĐƠN HÀNG
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                      <span>Tổng tiền hàng ({selectedItems.length} món):</span>
                      <strong style={{ color: "var(--text)" }}>{formatCurrency(subtotal)}</strong>
                    </div>

                    {appliedDiscount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#059669", fontWeight: "600" }}>
                        <span>Giảm giá voucher:</span>
                        <span>-{formatCurrency(appliedDiscount)}</span>
                      </div>
                    )}

                    <div style={{ height: "1px", backgroundColor: "var(--border-light)", margin: "6px 0" }} />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: "14px", fontWeight: "700" }}>Tổng thanh toán:</span>
                      <strong style={{ fontSize: "20px", color: "var(--primary)", fontWeight: "900" }}>
                        {formatCurrency(totalAmount)}
                      </strong>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    block
                    iconRight={ArrowRight}
                    onClick={handleProceedCheckout}
                    style={{ marginTop: "20px" }}
                  >
                    Mua Hàng ({selectedItems.length})
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
