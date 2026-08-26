import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, authFetch } from "../utils/auth";
import { useAuth } from "./Authcontext";
import Header from "../components/Header";
import "./CartPage.css";

const itemKey = (item) => `${item.productId}__${item.variantSku || ""}`;

export default function CartPage() {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [coupon, setCoupon] = useState("");
  useEffect(() => {
    if (!user?.userId) { window.location.href = "/login"; return; }
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await authFetch(`${API_BASE_URL}/cart/${user.userId}`);
      setCart(data);
      setSelectedKeys(new Set((data.items || []).map(itemKey)));
    } catch (err) {
      setMessage(err.message || "Không tải được giỏ hàng");
    } finally { setLoading(false); }
  };

  const groupedItems = useMemo(() => {
    return (cart?.items || []).reduce((groups, item) => {
      const shopId = item.shopId || "UNKNOWN_SHOP";
      if (!groups[shopId]) groups[shopId] = [];
      groups[shopId].push(item);
      return groups;
    }, {});
  }, [cart]);

  const selectedItems = (cart?.items || []).filter(item => selectedKeys.has(itemKey(item)));
  const totalPrice = selectedItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0
  );
  const itemCount = cart?.items?.length || 0;
  const allSelected = itemCount > 0 && selectedItems.length === itemCount;

  const setItemSelected = (item, checked) => {
    setSelectedKeys(previous => {
      const next = new Set(previous);
      checked ? next.add(itemKey(item)) : next.delete(itemKey(item));
      return next;
    });
  };

  const setShopSelected = (items, checked) => {
    setSelectedKeys(previous => {
      const next = new Set(previous);
      items.forEach(item => checked ? next.add(itemKey(item)) : next.delete(itemKey(item)));
      return next;
    });
  };

  const setAllSelected = (checked) => {
    setSelectedKeys(checked ? new Set((cart?.items || []).map(itemKey)) : new Set());
  };

  const removeItem = async (item) => {
    await authFetch(
      `${API_BASE_URL}/cart/${user.userId}/item?productId=${encodeURIComponent(item.productId)}&variantSku=${encodeURIComponent(item.variantSku || "")}`,
      { method: "DELETE" }
    );
  };

  const handleRemove = async (item) => {
    try {
      setLoading(true);
      await removeItem(item);
      setMessage("Đã xóa sản phẩm khỏi giỏ hàng.");
      await fetchCart();
    } catch (err) {
      setMessage(err.message || "Không xóa được sản phẩm.");
    } finally { setLoading(false); }
  };

  const handleDeleteSelected = async () => {
    if (!selectedItems.length) {
      setMessage("Bạn chưa chọn sản phẩm cần xóa.");
      return;
    }
    try {
      setLoading(true);
      await Promise.all(selectedItems.map(removeItem));
      setMessage(`Đã xóa ${selectedItems.length} sản phẩm đã chọn.`);
      await fetchCart();
    } catch (err) {
      setMessage(err.message || "Không xóa được các sản phẩm đã chọn.");
    } finally { setLoading(false); }
  };

  const goToCheckout = () => {
    if (!selectedItems.length) {
      setMessage("Vui lòng chọn ít nhất một sản phẩm để mua.");
      return;
    }
    sessionStorage.setItem("checkoutSelectedItems", JSON.stringify(
      selectedItems.map(item => ({
        productId: item.productId,
        variantSku: item.variantSku
      }))
    ));
    sessionStorage.setItem("checkoutCouponCode", coupon.trim());
    window.location.href = "/checkout";
  };

  return (
    <div className="cart-page">
      <Header />

      <div className="cart-body">
        <div className="breadcrumb"><a href="/">Trang chủ</a><span>›</span><span>Giỏ hàng</span></div>
        {message && <div className="alert alert-warn" style={{gridColumn:"1/-1"}}>{message}</div>}

        {loading && !cart ? (
          <div className="cart-empty-state"><p>Đang tải giỏ hàng...</p></div>
        ) : !cart?.items?.length ? (
          <div className="cart-empty-state">
            <p>Giỏ hàng của bạn đang trống</p>
            <button className="btn-primary" onClick={() => window.location.href = "/"}>Tiếp tục mua sắm</button>
          </div>
        ) : (
          <>
            <div className="cart-main">
              {Object.entries(groupedItems).map(([shopId, items]) => {
                const shopSelected = items.every(item => selectedKeys.has(itemKey(item)));
                return (
                  <section className="cart-shop" key={shopId}>
                    <label className="cart-shop-header">
                      <input type="checkbox" checked={shopSelected}
                        onChange={e => setShopSelected(items, e.target.checked)} />
                      <strong>🏪 Shop: {shopId}</strong>
                      <span>{items.length} sản phẩm</span>
                    </label>
                    <div className="cart-list">
                      {items.map(item => (
                        <div key={itemKey(item)} className="cart-item">
                          <input type="checkbox" checked={selectedKeys.has(itemKey(item))}
                            onChange={e => setItemSelected(item, e.target.checked)} />
                          <img src={item.image || "https://via.placeholder.com/80x80?text=SP"}
                            alt={item.productName}
                            onClick={() => window.location.href = `/product/${item.productId}`} />
                          <div>
                            <div className="cart-item-name">{item.productName}</div>
                            <div className="cart-item-sku">Phân loại: {item.variantSku}</div>
                          </div>
                          <div className="cart-item-price">{(item.price || 0).toLocaleString()}đ</div>
                          <div className="cart-qty"><input type="number" value={item.quantity} readOnly /></div>
                          <div className="cart-subtotal">{((item.price || 0) * (item.quantity || 1)).toLocaleString()}đ</div>
                          <button className="cart-remove" onClick={() => handleRemove(item)} title="Xóa">✕</button>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}

              <div className="cart-bottom">
                <label className="cart-select-all">
                  <input type="checkbox" checked={allSelected} onChange={e => setAllSelected(e.target.checked)} />
                  Chọn tất cả ({itemCount})
                </label>
                <button className="cart-delete-selected" onClick={handleDeleteSelected} disabled={loading}>
                  Xóa đã chọn
                </button>
              </div>
            </div>

            <div className="cart-sidebar">
              <div className="cart-voucher">
                <h4>🎟️ Mã giảm giá</h4>
                <div className="cart-voucher-input">
                  <input placeholder="Nhập mã voucher..." value={coupon} onChange={e => setCoupon(e.target.value)} />
                </div>
              </div>
              <div className="cart-summary-card">
                <h3>Tóm tắt đơn hàng</h3>
                <div className="summary-row"><span>Đã chọn ({selectedItems.length} sản phẩm)</span><span>{totalPrice.toLocaleString()}đ</span></div>
                <div className="summary-row total"><span>Tổng cộng</span><span>{totalPrice.toLocaleString()}đ</span></div>
                <button className="btn-primary cart-checkout-btn" onClick={goToCheckout}
                  disabled={loading || !selectedItems.length}>
                  Thanh toán ({selectedItems.length})
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
