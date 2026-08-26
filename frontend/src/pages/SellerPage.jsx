import { useEffect, useState,useRef} from "react";
import { API_BASE_URL, authFetch } from "../utils/auth";
import { useAuth } from "./Authcontext";
import Header from "../components/Header";
import "./SellerPage.css";

const emptyShop = { shopName: "", description: "", phone: "", email: "" };
const emptyProductInfo = { name: "", categoryId: "", description: "" };
const emptyVariant = { sku: "", color: "", size: "", price: "", discountPrice: "", stock: "", active: true };
const emptyCoupon = { code: "", discountType: "PERCENT", discountValue: "", minOrderValue: "", maxDiscountAmount: "", usageLimit: "" };

const ORDER_LABEL = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELED: "Đã huỷ",
  CANCELLED: "Đã huỷ",
};

const NEXT_STATUS = {
  PENDING: [["CONFIRMED", "Xác nhận đơn"]],
  CONFIRMED: [["PROCESSING", "Bắt đầu xử lý"]],
  PROCESSING: [],
  SHIPPING: [["DELIVERED", "Đánh dấu đã giao"]],
};

const REFUND_LABEL = { PENDING: "Chờ xử lý", APPROVED: "Đã duyệt", REJECTED: "Đã từ chối" };

const NAV_GROUPS = [
  { items: [["OVERVIEW", "Tổng quan"]] },
  { label: "Bán hàng", items: [["ORDERS", "Đơn hàng"], ["REFUNDS", "Hoàn tiền"]] },
  { label: "Sản phẩm", items: [["PRODUCTS", "Sản phẩm"], ["REVIEWS", "Đánh giá"]] },
  { label: "Marketing", items: [["COUPONS", "Mã giảm giá"]] },
  { label: "Tài chính", items: [["REVENUE", "Doanh thu"]] },
  { label: "Khác", items: [["CHAT", "Tin nhắn"], ["SETTINGS", "Cài đặt shop"]] },
];

async function uploadFile(url, file) {
  const formData = new FormData();
  formData.append("file", file);
  return authFetch(url, {
    method: "POST",
    body: formData,
  });
}

export default function SellerPage() {
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [refunds, setRefunds] = useState([]);

  const [shopForm, setShopForm] = useState(emptyShop);
  const [productInfo, setProductInfo] = useState(emptyProductInfo);
  const [variants, setVariants] = useState([{ ...emptyVariant }]);
  const [couponForm, setCouponForm] = useState(emptyCoupon);
  const [editingProduct, setEditingProduct] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [tab, setTab] = useState("OVERVIEW");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  const [openGroups, setOpenGroups] = useState(() => new Set(NAV_GROUPS.map((_, i) => i)));

  const toggleGroup = (gi) => {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(gi)) next.delete(gi); else next.add(gi);
      return next;
    });
  };

  const loadDashboard = async (shopData) => {
    const [productData, orderData, couponData, refundData] = await Promise.all([
      authFetch(`${API_BASE_URL}/products/shop/${shopData.id}`),
      authFetch(`${API_BASE_URL}/orders/shop/${shopData.id}`),
      authFetch(`${API_BASE_URL}/coupons/shop/${shopData.id}`).catch(() => []),
      authFetch(`${API_BASE_URL}/refunds/shop/${shopData.id}`).catch(() => []),
    ]);
    setProducts(Array.isArray(productData) ? productData : []);
    setOrders(Array.isArray(orderData) ? orderData : []);
    setCoupons(Array.isArray(couponData) ? couponData : []);
    setRefunds(Array.isArray(refundData) ? refundData : []);
  };

  useEffect(() => {
    if (!user?.userId) { window.location.href = "/login"; return; }
    (async () => {
      try {
        const [ownShop, categoryData] = await Promise.all([
          authFetch(`${API_BASE_URL}/shops/owner/${user.userId}`).catch(() => null),
          fetch(`${API_BASE_URL}/categories`).then((r) => r.ok ? r.json() : []),
        ]);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
        if (ownShop) {
          setShop(ownShop);
          setShopForm({
            shopName: ownShop.shopName || "",
            description: ownShop.description || "",
            phone: ownShop.phone || "",
            email: ownShop.email || "",
          });
          await loadDashboard(ownShop);
        }
      } catch (e) {
        setError(e.message || "Không thể tải kênh người bán.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.userId]);

  const pendingOrders = orders.filter((o) => ["PENDING", "CONFIRMED", "PROCESSING"].includes(o.orderStatus));
  const deliveredOrders = orders.filter((o) => o.orderStatus === "DELIVERED");
  const revenue = deliveredOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const lowStock = products.filter((p) => (p.variants || []).some((v) => (v.stock ?? 0) <= 10));
  const filteredOrders = tab === "ORDERS" ? orders : pendingOrders.slice(0, 5);

  const clearAlerts = () => { setError(""); setMessage(""); };

  // ===== Shop =====
  const saveShop = async (event) => {
    event.preventDefault(); setSaving(true); clearAlerts();
    try {
      const body = { ...shopForm, ownerId: String(user.userId) };
      const data = shop
        ? await authFetch(`${API_BASE_URL}/shops/${shop.id}`, { method: "PUT", body: JSON.stringify(body) })
        : await authFetch(`${API_BASE_URL}/shops`, { method: "POST", body: JSON.stringify(body) });
      setShop(data);
      setMessage("Đã lưu thông tin shop.");
      if (!shop) await loadDashboard(data);
    } catch (e) {
      setError(e.message || "Không thể lưu shop.");
    } finally {
      setSaving(false);
    }
  };

  const toggleShopStatus = async () => {
    const nextStatus = shop.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const updated = await authFetch(`${API_BASE_URL}/shops/${shop.id}/status?status=${nextStatus}`, { method: "PATCH" });
      setShop(updated);
      setMessage(`Đã chuyển shop sang trạng thái ${nextStatus === "ACTIVE" ? "hoạt động" : "tạm ngưng"}.`);
    } catch (e) {
      setError(e.message || "Không thể đổi trạng thái shop.");
    }
  };

  // ===== Sản phẩm: thông tin + biến thể =====
  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductInfo({
      name: product.name || "",
      categoryId: product.categoryId || "",
      description: product.description || "",
    });
    setVariants(
      product.variants?.length
        ? product.variants.map((v) => ({
            sku: v.sku || "",
            color: v.color || "",
            size: v.size || "",
            price: v.price ?? "",
            discountPrice: v.discountPrice ?? "",
            stock: v.stock ?? "",
            active: v.active !== false,
          }))
        : [{ ...emptyVariant }]
    );
    setTab("PRODUCTS");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEditProduct = () => {
    setEditingProduct(null);
    setProductInfo(emptyProductInfo);
    setVariants([{ ...emptyVariant }]);
  };

  const updateVariantField = (index, field, value) => {
    setVariants((current) => current.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const addVariantRow = () => setVariants((current) => [...current, { ...emptyVariant }]);

  const removeVariantRow = (index) => {
    setVariants((current) => current.length > 1 ? current.filter((_, i) => i !== index) : current);
  };

  const saveProduct = async (event) => {
    event.preventDefault(); setSaving(true); clearAlerts();
    try {
      const cleanVariants = variants.map((v, i) => ({
        sku: v.sku.trim() || `SHOP-${Date.now()}-${i}`,
        color: v.color.trim() || undefined,
        size: v.size.trim() || undefined,
        price: Number(v.price) || 0,
        discountPrice: v.discountPrice ? Number(v.discountPrice) : undefined,
        stock: Number(v.stock) || 0,
        active: v.active,
      }));

      if (cleanVariants.some((v) => !Number.isFinite(v.price) || v.price < 0 || !Number.isFinite(v.stock) || v.stock < 0)) {
        throw new Error("Giá và tồn kho của biến thể phải là số không âm.");
      }
      if (cleanVariants.some((v) => v.discountPrice !== undefined && (!Number.isFinite(v.discountPrice) || v.discountPrice < 0 || v.discountPrice > v.price))) {
        throw new Error("Giá khuyến mãi phải từ 0 đến giá bán của biến thể.");
      }

      const basePrice = Math.min(...cleanVariants.map((v) => v.price));

      const body = {
        shopId: shop.id,
        categoryId: productInfo.categoryId,
        name: productInfo.name,
        description: productInfo.description,
        basePrice,
        variants: cleanVariants,
      };

      if (editingProduct) {
        const updated = await authFetch(`${API_BASE_URL}/products/${editingProduct.id}`, { method: "PUT", body: JSON.stringify(body) });
        setProducts((current) => current.map((p) => p.id === updated.id ? updated : p));
        setEditingProduct(updated);
        setMessage("Đã cập nhật sản phẩm.");
      } else {
        const created = await authFetch(`${API_BASE_URL}/products`, { method: "POST", body: JSON.stringify(body) });
        setProducts((current) => [created, ...current]);
        setEditingProduct(created);
        setMessage("Đã tạo sản phẩm. Giờ bạn có thể thêm ảnh/video ở khối bên dưới.");
      }
    } catch (e) {
      setError(e.message || "Không thể lưu sản phẩm.");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Xoá sản phẩm "${product.name}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await authFetch(`${API_BASE_URL}/products/${product.id}`, { method: "DELETE" });
      setProducts((current) => current.filter((p) => p.id !== product.id));
      setMessage("Đã xoá sản phẩm.");
      if (editingProduct?.id === product.id) cancelEditProduct();
    } catch (e) {
      setError(e.message || "Không thể xoá sản phẩm.");
    }
  };

  // ===== Cập nhật ảnh & video sản phẩm =====
  const handleUploadMedia = async (mediaItems) => {
    if (!editingProduct || !mediaItems.length) return;
    clearAlerts();
    setUploadingMedia(true);
    try {
      for (const { file, mediaType, isMain } of mediaItems) {
        const url = `${API_BASE_URL}/api/links/PRODUCT/${editingProduct.id}/${mediaType}/${isMain}`;
        await uploadFile(url, file);
      }
      const refreshed = await authFetch(`${API_BASE_URL}/products/${editingProduct.id}`);
      setEditingProduct(refreshed);
      setProducts((current) => current.map((p) => p.id === refreshed.id ? refreshed : p));
      setMessage("Đã cập nhật ảnh và video sản phẩm.");
      return true;
    } catch (e) {
      setError(e.message || "Không thể tải lên.");
      return false;
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleDeleteMedia = async (mediaType, mediaUrl) => {
    if (!editingProduct) return;
    try {
      const url = `${API_BASE_URL}/api/links/PRODUCT/${editingProduct.id}/${mediaType}?url=${encodeURIComponent(mediaUrl)}`;
      await authFetch(url, { method: "DELETE" });
      const refreshed = await authFetch(`${API_BASE_URL}/products/${editingProduct.id}`);
      setEditingProduct(refreshed);
      setProducts((current) => current.map((p) => p.id === refreshed.id ? refreshed : p));
      setMessage("Đã xoá.");
    } catch (e) {
      setError(e.message || "Không thể xoá.");
    }
  };

  // ===== Đơn hàng =====
  const updateOrderStatus = async (order, status) => {
    try {
      const updated = await authFetch(`${API_BASE_URL}/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, updatedBy: "SELLER", note: "Cập nhật từ kênh người bán" }),
      });
      setOrders((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage("Đã cập nhật trạng thái đơn hàng.");
    } catch (e) {
      setError(e.message || "Không thể cập nhật đơn hàng.");
    }
  };

  const startShipping = async (order, shippingProvider, trackingCode) => {
    clearAlerts();
    try {
      const updated = await authFetch(`${API_BASE_URL}/orders/${order.id}/shipping`, {
        method: "PATCH",
        body: JSON.stringify({
          shippingProvider,
          trackingCode,
          note: `Mã vận đơn ${trackingCode}`,
        }),
      });
      setOrders((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage("Đã bàn giao đơn cho vận chuyển.");
    } catch (e) {
      setError(e.message || "Không thể cập nhật vận chuyển.");
    }
  };

  const cancelOrder = async (order) => {
    const reason = window.prompt("Lý do huỷ đơn (hiển thị cho khách hàng):");
    if (reason === null) return;
    try {
      const updated = await authFetch(`${API_BASE_URL}/orders/${order.id}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ canceledBy: "SELLER", reason: reason || "Người bán huỷ đơn" }),
      });
      setOrders((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage("Đã huỷ đơn hàng.");
    } catch (e) {
      setError(e.message || "Không thể huỷ đơn hàng.");
    }
  };

  // ===== Mã giảm giá =====
  const saveCoupon = async (event) => {
    event.preventDefault(); setSaving(true); clearAlerts();
    try {
      const body = {
        shopId: shop.id,
        scope: "SHOP",
        code: couponForm.code.trim().toUpperCase(),
        discountType: couponForm.discountType,
        discountValue: Number(couponForm.discountValue),
        minOrderValue: couponForm.minOrderValue ? Number(couponForm.minOrderValue) : 0,
        maxDiscountAmount: couponForm.maxDiscountAmount ? Number(couponForm.maxDiscountAmount) : undefined,
        usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : undefined,
      };
      const created = await authFetch(`${API_BASE_URL}/coupons`, { method: "POST", body: JSON.stringify(body) });
      setCoupons((current) => [created, ...current]);
      setCouponForm(emptyCoupon);
      setMessage("Đã tạo mã giảm giá.");
    } catch (e) {
      setError(e.message || "Không thể tạo mã giảm giá.");
    } finally {
      setSaving(false);
    }
  };

  const deactivateCoupon = async (coupon) => {
    try {
      const updated = await authFetch(`${API_BASE_URL}/coupons/${coupon.id}/deactivate`, { method: "PATCH" });
      setCoupons((current) => current.map((c) => c.id === updated.id ? updated : c));
      setMessage("Đã tắt mã giảm giá.");
    } catch (e) {
      setError(e.message || "Không thể tắt mã giảm giá.");
    }
  };

  // ===== Hoàn tiền =====
  const processRefund = async (refund, status) => {
    const adminNote = status === "REJECTED" ? window.prompt("Lý do từ chối:") : "";
    if (status === "REJECTED" && adminNote === null) return;
    try {
      const params = new URLSearchParams({ status, resolvedBy: String(user.userId) });
      if (adminNote) params.append("adminNote", adminNote);
      const updated = await authFetch(`${API_BASE_URL}/refunds/${refund.id}/process?${params.toString()}`, { method: "PATCH" });
      setRefunds((current) => current.map((r) => r.id === updated.id ? updated : r));
      setMessage(status === "APPROVED" ? "Đã duyệt yêu cầu hoàn tiền." : "Đã từ chối yêu cầu hoàn tiền.");
    } catch (e) {
      setError(e.message || "Không thể xử lý yêu cầu hoàn tiền.");
    }
  };

  // ===== Đánh giá =====
  const loadReviews = async () => {
    if (reviewsLoaded || !products.length) return;
    setReviewsLoading(true);
    try {
      const results = await Promise.all(
        products.map((p) =>
          authFetch(`${API_BASE_URL}/reviews/product/${p.id}?page=0&size=50`)
            .then((res) => (res?.content || []).map((r) => ({ ...r, productId: p.id, productName: p.name })))
            .catch(() => [])
        )
      );
      const all = results.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReviews(all);
      setReviewsLoaded(true);
    } catch (e) {
      setError(e.message || "Không thể tải đánh giá.");
    } finally {
      setReviewsLoading(false);
    }
  };

  const replyReview = async (review, content) => {
    try {
      const updated = await authFetch(`${API_BASE_URL}/reviews/${review.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      setReviews((current) => current.map((r) => r.id === updated.id ? { ...updated, productId: r.productId, productName: r.productName } : r));
      setMessage("Đã gửi phản hồi.");
    } catch (e) {
      setError(e.message || "Không thể gửi phản hồi.");
    }
  };

  const handleTabChange = (id) => {
    setTab(id);
    if (id === "REVIEWS") loadReviews();
  };

  if (loading) {
    return <div className="seller-page"><Header /><p className="seller-loading">Đang tải kênh người bán...</p></div>;
  }

  if (!shop) {
    return (
      <div className="seller-page page-shell">
        <Header />
        <main className="seller-body seller-body-standalone">
          <h1>Mở shop trên DoMix</h1>
          <form className="seller-card seller-form card" onSubmit={saveShop}>
            <label>Tên shop
              <input required value={shopForm.shopName} onChange={(e) => setShopForm({ ...shopForm, shopName: e.target.value })} />
            </label>
            <label>Số điện thoại
              <input value={shopForm.phone} onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })} />
            </label>
            <label>Email
              <input type="email" value={shopForm.email} onChange={(e) => setShopForm({ ...shopForm, email: e.target.value })} />
            </label>
            <label className="wide">Giới thiệu
              <textarea value={shopForm.description} onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })} />
            </label>
            <button className="btn-primary wide" disabled={saving}>{saving ? "Đang lưu..." : "Đăng ký shop"}</button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="seller-page page-shell">
      <Header />

      <div className="seller-top">
        <div className="seller-head">
          <div>
            <small>KÊNH NGƯỜI BÁN</small>
            <h1>{shop.shopName}</h1>
          </div>
          <a className="btn-secondary" href={`/shop/${shop.id}`}>Xem shop</a>
        </div>
        {error && <div className="seller-alert error">{error}</div>}
        {message && <div className="seller-alert ok">{message}</div>}
      </div>

      <div className="seller-shell">
        <aside className="seller-sidebar">
          <nav className="seller-nav">
            {NAV_GROUPS.map((group, gi) => {
              const isOpen = openGroups.has(gi);
              return (
                <div className={`seller-nav-group${group.label ? " has-label" : ""}`} key={gi}>
                  {group.label && (
                    <button
                      type="button"
                      className="seller-nav-group-toggle"
                      onClick={() => toggleGroup(gi)}
                      aria-expanded={isOpen}
                    >
                      <span>{group.label}</span>
                      <span className={`seller-nav-chevron${isOpen ? " open" : ""}`}>▾</span>
                    </button>
                  )}
                  {(!group.label || isOpen) && (
                    <div className="seller-nav-items">
                      {group.items.map(([id, label]) => (
                        <button
                          key={id}
                          className={`seller-nav-item${tab === id ? " active" : ""}`}
                          onClick={() => handleTabChange(id)}
                        >
                          {label}
                          {id === "REFUNDS" && refunds.some((r) => r.status === "PENDING") && (
                            <span className="seller-tab-badge">{refunds.filter((r) => r.status === "PENDING").length}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="seller-body">
          {tab === "OVERVIEW" && (
            <>
              <section className="seller-revenue-grid">
                <article className="seller-revenue-card">
                  <span>Doanh thu (đơn đã giao)</span>
                  <strong>{revenue.toLocaleString("vi-VN")} ₫</strong>
                  <small>{deliveredOrders.length} đơn hoàn thành</small>
                </article>
                <article className="seller-revenue-card">
                  <span>Đơn cần xử lý</span>
                  <strong>{pendingOrders.length}</strong>
                  <small>Chờ xác nhận / đang xử lý</small>
                </article>
                <article className="seller-revenue-card">
                  <span>Tồn kho thấp</span>
                  <strong>{lowStock.length}</strong>
                  <small>Có biến thể ≤ 10 sản phẩm</small>
                </article>
                <article className="seller-revenue-card">
                  <span>Đánh giá shop</span>
                  <strong>{Number(shop.rating || 0).toFixed(1)} ★</strong>
                  <small>{shop.totalReviews || 0} lượt đánh giá</small>
                </article>
              </section>
              <OrderList orders={filteredOrders} compact onUpdate={updateOrderStatus} onCancel={cancelOrder} onStartShipping={startShipping} />
              <section className="seller-card card">
                <h2>Cảnh báo tồn kho thấp</h2>
                {lowStock.length
                  ? lowStock.map((p) => (
                      <p key={p.id}>
                        {p.name} — {p.variants?.filter((v) => (v.stock ?? 0) <= 10).map((v) => `${v.sku}: ${v.stock}`).join(", ")}
                      </p>
                    ))
                  : <p>Không có sản phẩm sắp hết hàng.</p>}
              </section>
            </>
          )}

          {tab === "ORDERS" && <OrderList orders={orders} onUpdate={updateOrderStatus} onCancel={cancelOrder} onStartShipping={startShipping} />}

          {tab === "PRODUCTS" && (
            <section className="seller-grid">
              <div className="seller-product-editor">
                <form className="seller-card seller-form card" onSubmit={saveProduct}>
                  <h2>{editingProduct ? `Sửa thông tin: ${editingProduct.name}` : "Đăng sản phẩm mới"}</h2>

                  <label className="wide">Tên sản phẩm
                    <input required value={productInfo.name} onChange={(e) => setProductInfo({ ...productInfo, name: e.target.value })} />
                  </label>
                  <label>Danh mục
                    <select required value={productInfo.categoryId} onChange={(e) => setProductInfo({ ...productInfo, categoryId: e.target.value })}>
                      <option value="">Chọn danh mục</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                  <label className="wide">Mô tả
                    <textarea value={productInfo.description} onChange={(e) => setProductInfo({ ...productInfo, description: e.target.value })} />
                  </label>

                  <div className="wide">
                    <div className="variant-editor-head">
                      <h3>Biến thể sản phẩm</h3>
                      <button type="button" className="btn-secondary btn-sm" onClick={addVariantRow}>+ Thêm biến thể</button>
                    </div>

                    {variants.map((v, i) => (
                      <div className="variant-row" key={i}>
                        <input placeholder="SKU" value={v.sku} onChange={(e) => updateVariantField(i, "sku", e.target.value)} />
                        <input placeholder="Màu" value={v.color} onChange={(e) => updateVariantField(i, "color", e.target.value)} />
                        <input placeholder="Size" value={v.size} onChange={(e) => updateVariantField(i, "size", e.target.value)} />
                        <input required type="number" min="0" placeholder="Giá" value={v.price} onChange={(e) => updateVariantField(i, "price", e.target.value)} />
                        <input type="number" min="0" placeholder="Giá KM" value={v.discountPrice} onChange={(e) => updateVariantField(i, "discountPrice", e.target.value)} />
                        <input required type="number" min="0" placeholder="Tồn kho" value={v.stock} onChange={(e) => updateVariantField(i, "stock", e.target.value)} />
                        <label className="variant-active">
                          <input type="checkbox" checked={v.active} onChange={(e) => updateVariantField(i, "active", e.target.checked)} />
                          Bật bán
                        </label>
                        {variants.length > 1 && (
                          <button type="button" className="btn-danger btn-sm" onClick={() => removeVariantRow(i)}>Xoá</button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="wide actions">
                    {editingProduct && <button type="button" className="btn-secondary" onClick={cancelEditProduct}>Xong, đóng form</button>}
                    <button className="btn-primary" disabled={saving}>
                      {saving ? "Đang lưu..." : editingProduct ? "Cập nhật thông tin" : "Đăng sản phẩm"}
                    </button>
                  </div>
                </form>

                {editingProduct && (
                  <section className="seller-card card">
                    <ImageManager
                      product={editingProduct}
                      onUpload={handleUploadMedia}
                      onDelete={handleDeleteMedia}
                      uploading={uploadingMedia}
                    />
                  </section>
                )}
              </div>

              <ProductList products={products} onEdit={openEditProduct} onDelete={deleteProduct} />
            </section>
          )}

          {tab === "REVIEWS" && (
            <ReviewsPanel loading={reviewsLoading} reviews={reviews} onReply={replyReview} />
          )}

          {tab === "COUPONS" && (
            <section className="seller-grid">
              <form className="seller-card seller-form card" onSubmit={saveCoupon}>
                <h2>Tạo mã giảm giá</h2>
                <label>Mã code
                  <input required value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} placeholder="VD: SALE50" />
                </label>
                <label>Loại giảm
                  <select value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}>
                    <option value="PERCENT">Theo phần trăm (%)</option>
                    <option value="AMOUNT">Số tiền cố định</option>
                  </select>
                </label>
                <label>Giá trị giảm
                  <input required min="0" type="number" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} />
                </label>
                <label>Đơn tối thiểu
                  <input min="0" type="number" value={couponForm.minOrderValue} onChange={(e) => setCouponForm({ ...couponForm, minOrderValue: e.target.value })} />
                </label>
                {couponForm.discountType === "PERCENT" && (
                  <label>Giảm tối đa
                    <input min="0" type="number" value={couponForm.maxDiscountAmount} onChange={(e) => setCouponForm({ ...couponForm, maxDiscountAmount: e.target.value })} />
                  </label>
                )}
                <label>Giới hạn lượt dùng
                  <input min="1" type="number" value={couponForm.usageLimit} onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })} placeholder="Không giới hạn" />
                </label>
                <button className="btn-primary wide" disabled={saving}>{saving ? "Đang tạo..." : "Tạo mã giảm giá"}</button>
              </form>
              <CouponList coupons={coupons} onDeactivate={deactivateCoupon} />
            </section>
          )}

          {tab === "REFUNDS" && <RefundList refunds={refunds} onProcess={processRefund} />}

          {tab === "REVENUE" && (
            <>
              <section className="seller-revenue-grid seller-revenue-grid-single">
                <article className="seller-revenue-card">
                  <span>Tổng doanh thu (đơn đã giao)</span>
                  <strong>{revenue.toLocaleString("vi-VN")} ₫</strong>
                  <small>{deliveredOrders.length} đơn hoàn thành</small>
                </article>
              </section>
              <OrderList orders={deliveredOrders} onUpdate={updateOrderStatus} onCancel={cancelOrder} onStartShipping={startShipping} />
            </>
          )}

          {tab === "CHAT" && <ChatPanel shopId={shop.id} currentUserId={user.userId} />}

          {tab === "SETTINGS" && (
            <section className="seller-grid">
              <form className="seller-card seller-form card" onSubmit={saveShop}>
                <h2>Thông tin shop</h2>
                <label>Tên shop
                  <input required value={shopForm.shopName} onChange={(e) => setShopForm({ ...shopForm, shopName: e.target.value })} />
                </label>
                <label>Số điện thoại
                  <input value={shopForm.phone} onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })} />
                </label>
                <label>Email
                  <input type="email" value={shopForm.email} onChange={(e) => setShopForm({ ...shopForm, email: e.target.value })} />
                </label>
                <label className="wide">Giới thiệu
                  <textarea value={shopForm.description} onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })} />
                </label>
                <button className="btn-primary wide" disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</button>
              </form>
              <section className="seller-card card">
                <h2>Trạng thái hoạt động</h2>
                <p>Shop hiện đang: <strong>{shop.status === "ACTIVE" ? "Hoạt động" : "Tạm ngưng"}</strong></p>
                <button type="button" className="btn-secondary" onClick={toggleShopStatus}>
                  {shop.status === "ACTIVE" ? "Tạm ngưng shop" : "Kích hoạt lại shop"}
                </button>
              </section>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function OrderList({ orders, compact, onUpdate, onCancel, onStartShipping }) {
  const [shippingDrafts, setShippingDrafts] = useState({});

  const updateShippingDraft = (orderId, field, value) => {
    setShippingDrafts((current) => ({
      ...current,
      [orderId]: { shippingProvider: "GHN", trackingCode: "", ...current[orderId], [field]: value },
    }));
  };

  return (
    <section className="seller-card card">
      <h2>{compact ? "Đơn hàng cần xử lý" : "Tất cả đơn hàng"}</h2>
      {orders.length ? (
        <div className="seller-order-list">
          {orders.map((o) => {
            const nextActions = NEXT_STATUS[o.orderStatus] || [];
            const canCancel = ["PENDING", "CONFIRMED"].includes(o.orderStatus);
            const shippingDraft = { shippingProvider: "GHN", trackingCode: "", ...shippingDrafts[o.id] };
            return (
              <article className="seller-order" data-status={o.orderStatus} key={o.id}>
                <div>
                  <strong>#{o.orderCode || o.id}</strong>
                  <span>{ORDER_LABEL[o.orderStatus] || o.orderStatus} · {Number(o.totalAmount || 0).toLocaleString("vi-VN")} ₫</span>
                </div>
                <div className="seller-order-actions">
                  {nextActions.map(([status, label]) => (
                    <button key={status} className="btn-primary btn-sm" onClick={() => onUpdate(o, status)}>{label}</button>
                  ))}
                  {canCancel && <button className="btn-secondary btn-sm" onClick={() => onCancel(o)}>Huỷ đơn</button>}
                </div>
                {o.orderStatus === "PROCESSING" && (
                  <div className="seller-shipping-form">
                    <select value={shippingDraft.shippingProvider} onChange={(e) => updateShippingDraft(o.id, "shippingProvider", e.target.value)} aria-label="Hãng vận chuyển">
                      <option value="GHN">Giao Hàng Nhanh</option>
                      <option value="GHTK">Giao Hàng Tiết Kiệm</option>
                      <option value="VIETTEL_POST">Viettel Post</option>
                    </select>
                    <input value={shippingDraft.trackingCode} onChange={(e) => updateShippingDraft(o.id, "trackingCode", e.target.value)} placeholder="Mã vận đơn, VD: GHN-DEMO-001" />
                    <button type="button" className="btn-primary btn-sm" disabled={!shippingDraft.trackingCode.trim()} onClick={() => onStartShipping(o, shippingDraft.shippingProvider, shippingDraft.trackingCode.trim())}>
                      Bàn giao vận chuyển
                    </button>
                  </div>
                )}
                {o.orderStatus === "SHIPPING" && (
                  <small className="seller-shipping-info">{o.shippingProvider || "Đơn vị vận chuyển"} · {o.trackingCode || "Chưa có mã vận đơn"}</small>
                )}
              </article>
            );
          })}
        </div>
      ) : <p className="seller-empty">Chưa có đơn hàng.</p>}
    </section>
  );
}

function ProductList({ products, onEdit, onDelete }) {
  return (
    <section className="seller-card card">
      <h2>Sản phẩm của tôi ({products.length})</h2>
      {products.length ? products.map((p) => (
        <div className="seller-product" key={p.id}>
          <a href={`/product/${p.id}`} className="seller-product-link">
            <img src={p.images?.[0]?.url || "https://via.placeholder.com/56"} alt="" />
            <span>
              <b>{p.name}</b>
              <small>{Number(p.basePrice || 0).toLocaleString("vi-VN")} ₫ · {p.variants?.length || 0} biến thể</small>
            </span>
          </a>
          <div className="seller-product-actions">
            <button type="button" className="btn-secondary btn-sm" onClick={() => onEdit(p)}>Sửa</button>
            <button type="button" className="btn-danger btn-sm" onClick={() => onDelete(p)}>Xoá</button>
          </div>
        </div>
      )) : <p className="seller-empty">Chưa có sản phẩm nào.</p>}
    </section>
  );
}

function ImageManager({ product, onUpload, onDelete, uploading }) {
  const isVideo = (media) => media?.imageVideo === "VIDEO";
  const media = product.images || [];
  const [pendingMedia, setPendingMedia] = useState([]);

  const handleFileChange = (e, mediaType, isMain) => {
    const file = e.target.files?.[0];
    if (file) setPendingMedia((current) => [...current, { file, mediaType, isMain }]);
    e.target.value = "";
  };

  const updateMedia = async () => {
    const updated = await onUpload(pendingMedia);
    if (updated) setPendingMedia([]);
  };

  return (
    <div className="image-manager">
      <h2>Ảnh & video sản phẩm</h2>
      <p>Chọn ảnh hoặc video trước, sau đó bấm “Cập nhật ảnh & video”. Thông tin sản phẩm được cập nhật bằng nút riêng.</p>

      {media.length > 0 ? (
        <div className="image-manager-grid">
          {media.map((m, i) => (
            <div className="image-manager-item" key={m.key || m.url || i}>
              {isVideo(m) ? <video src={m.url} muted /> : <img src={m.url} alt="" />}
              {m.isMain && <span className="image-main-badge">Chính</span>}
              {isVideo(m) && <span className="image-video-badge">▶ Video</span>}
              <button
                type="button"
                className="image-remove-btn"
                onClick={() => onDelete(isVideo(m) ? "VIDEO" : "IMAGE", m.key || m.url)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="image-manager-empty">Chưa có ảnh/video nào. Thêm ít nhất 1 ảnh để sản phẩm hiển thị đẹp hơn.</p>
      )}

      <div className="image-manager-upload">
        <label className="btn-secondary btn-sm">
          Chọn ảnh phụ
          <input type="file" accept="image/*" hidden onChange={(e) => handleFileChange(e, "IMAGE", false)} />
        </label>
        <label className="btn-primary btn-sm">
          Chọn ảnh chính
          <input type="file" accept="image/*" hidden onChange={(e) => handleFileChange(e, "IMAGE", true)} />
        </label>
        <label className="btn-secondary btn-sm">
          Chọn video
          <input type="file" accept="video/*" hidden onChange={(e) => handleFileChange(e, "VIDEO", false)} />
        </label>
      </div>
      <div className="image-manager-pending">
        <span>{pendingMedia.length ? `Đã chọn ${pendingMedia.length} tệp.` : "Chưa chọn ảnh hoặc video mới."}</span>
        <button type="button" className="btn-primary btn-sm" onClick={updateMedia} disabled={uploading || !pendingMedia.length}>
          {uploading ? "Đang cập nhật..." : "Cập nhật ảnh & video"}
        </button>
      </div>
    </div>
  );
}

function ReviewsPanel({ loading, reviews, onReply }) {
  const [replyDrafts, setReplyDrafts] = useState({});

  const submitReply = (review) => {
    const content = (replyDrafts[review.id] || "").trim();
    if (!content) return;
    onReply(review, content);
    setReplyDrafts((current) => ({ ...current, [review.id]: "" }));
  };

  return (
    <section className="seller-card card">
      <h2>Đánh giá sản phẩm ({reviews.length})</h2>
      {loading ? (
        <p className="seller-empty">Đang tải đánh giá từ tất cả sản phẩm...</p>
      ) : reviews.length ? (
        <div className="seller-review-list">
          {reviews.map((r) => (
            <article className="seller-review" key={r.id}>
              <div className="seller-review-head">
                <strong>{r.userName || "Khách hàng"}</strong>
                <span className="seller-review-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                <span className="seller-review-product">— {r.productName}</span>
              </div>
              {r.comment && <p>{r.comment}</p>}
              {r.imageUrls?.length > 0 && (
                <div className="seller-review-images">
                  {r.imageUrls.map((img, i) => <img key={i} src={img} alt="" />)}
                </div>
              )}
              {r.shopReply ? (
                <p className="seller-review-reply">Bạn đã trả lời: {r.shopReply.content}</p>
              ) : (
                <div className="seller-review-reply-form">
                  <input
                    placeholder="Trả lời đánh giá này..."
                    value={replyDrafts[r.id] || ""}
                    onChange={(e) => setReplyDrafts((current) => ({ ...current, [r.id]: e.target.value }))}
                  />
                  <button type="button" className="btn-primary btn-sm" onClick={() => submitReply(r)}>Gửi</button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="seller-empty">Chưa có đánh giá nào.</p>
      )}
    </section>
  );
}

function CouponList({ coupons, onDeactivate }) {
  return (
    <section className="seller-card card">
      <h2>Mã giảm giá của shop ({coupons.length})</h2>
      {coupons.length ? coupons.map((c) => (
        <article className="seller-coupon" key={c.id}>
          <div>
            <strong>{c.code}</strong>
            <span>
              {c.discountType === "PERCENT" ? `Giảm ${c.discountValue}%` : `Giảm ${Number(c.discountValue).toLocaleString("vi-VN")} ₫`}
              {" · "}Đã dùng {c.usedCount || 0}{c.usageLimit ? `/${c.usageLimit}` : ""}
            </span>
          </div>
          {c.active ? (
            <button type="button" className="btn-secondary btn-sm" onClick={() => onDeactivate(c)}>Tắt mã</button>
          ) : (
            <span className="seller-coupon-off">Đã tắt</span>
          )}
        </article>
      )) : <p className="seller-empty">Chưa có mã giảm giá nào.</p>}
    </section>
  );
}

function RefundList({ refunds, onProcess }) {
  return (
    <section className="seller-card card">
      <h2>Yêu cầu hoàn tiền / đổi trả ({refunds.length})</h2>
      {refunds.length ? refunds.map((r) => (
        <article className="seller-refund" key={r.id}>
          <div>
            <strong>Đơn #{r.orderId}</strong>
            <span className={`seller-refund-status status-${r.status?.toLowerCase()}`}>{REFUND_LABEL[r.status] || r.status}</span>
            <p>{r.reason}</p>
            {r.images?.length > 0 && (
              <div className="seller-refund-images">
                {r.images.map((img, i) => <img key={i} src={img} alt={`refund-${i}`} />)}
              </div>
            )}
          </div>
          {r.status === "PENDING" && (
            <div className="seller-refund-actions">
              <button type="button" className="btn-primary btn-sm" onClick={() => onProcess(r, "APPROVED")}>Duyệt</button>
              <button type="button" className="btn-secondary btn-sm" onClick={() => onProcess(r, "REJECTED")}>Từ chối</button>
            </div>
          )}
        </article>
      )) : <p className="seller-empty">Chưa có yêu cầu hoàn tiền nào.</p>}
    </section>
  );
}

function ChatPanel({ shopId, currentUserId }) {
  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(true);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [pendingImages, setPendingImages] = useState([]);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const messagesEndRef = useRef(null);

  const loadConversations = async () => {
    try {
      const data = await authFetch(`${API_BASE_URL}/api/chat/conversations/shop/${shopId}`);
      setConversations(Array.isArray(data) ? data : []);
    } catch (e) {
      setChatError(e.message || "Không thể tải danh sách hội thoại.");
    }
  };

  useEffect(() => {
    (async () => { setConvLoading(true); await loadConversations(); setConvLoading(false); })();
    const interval = setInterval(loadConversations, 8000);
    return () => clearInterval(interval);
  }, [shopId]);

  const loadMessages = async (conversationId, { silent } = {}) => {
    if (!silent) setMsgLoading(true);
    try {
      const data = await authFetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/messages?page=0&size=30`);
      setMessages(Array.isArray(data?.content) ? [...data.content].reverse() : []);
    } catch (e) {
      setChatError(e.message || "Không thể tải tin nhắn.");
    } finally {
      if (!silent) setMsgLoading(false);
    }
  };

  const openConversation = async (conv) => {
    setActiveConvId(conv.id);
    setChatError("");
    await loadMessages(conv.id);
    try {
      await authFetch(`${API_BASE_URL}/api/chat/conversations/${conv.id}/read`, { method: "PATCH" });
      setConversations((current) => current.map((c) => c.id === conv.id ? { ...c, unreadCountForShop: 0 } : c));
    } catch {
      // không chặn luồng chat nếu mark-as-read lỗi
    }
  };

  useEffect(() => {
    if (!activeConvId) return;
    const interval = setInterval(() => loadMessages(activeConvId, { silent: true }), 4000);
    return () => clearInterval(interval);
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleImagePick = (e) => {
    const files = Array.from(e.target.files || []);
    setPendingImages((current) => [...current, ...files]);
    e.target.value = "";
  };

  const removePendingImage = (index) => {
    setPendingImages((current) => current.filter((_, i) => i !== index));
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!activeConvId || (!draft.trim() && !pendingImages.length)) return;
    setSending(true); setChatError("");
    try {
      const formData = new FormData();
      formData.append("conversationId", activeConvId);
      formData.append("senderId", String(currentUserId));
      formData.append("senderRole", "SHOP");
      if (draft.trim()) formData.append("content", draft.trim());
      pendingImages.forEach((file) => formData.append("images", file));

      const created = await authFetch(`${API_BASE_URL}/api/chat/messages`, { method: "POST", body: formData });
      setMessages((current) => [...current, created]);
      setDraft("");
      setPendingImages([]);
      loadConversations();
    } catch (e) {
      setChatError(e.message || "Không thể gửi tin nhắn.");
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (message) => {
    if (!window.confirm("Xoá tin nhắn này?")) return;
    try {
      await authFetch(`${API_BASE_URL}/api/chat/messages/${message.id}`, { method: "DELETE" });
      setMessages((current) => current.filter((m) => m.id !== message.id));
    } catch (e) {
      setChatError(e.message || "Không thể xoá tin nhắn.");
    }
  };

  return (
    <section className="seller-card card seller-chat-card">
      <h2>Tin nhắn với khách hàng</h2>
      {chatError && <div className="seller-alert error">{chatError}</div>}
      <div className="seller-chat">
        <div className="seller-chat-list">
          {convLoading ? (
            <p className="seller-empty">Đang tải hội thoại...</p>
          ) : conversations.length ? (
            conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`seller-chat-item${activeConvId === c.id ? " active" : ""}`}
                onClick={() => openConversation(c)}
              >
                <span className="seller-chat-item-name">{c.userId ? `Khách #${c.userId}` : "Khách hàng"}</span>
                <span className="seller-chat-item-last">
                  {c.lastMessageType === "IMAGE" ? "[Hình ảnh]" : (c.lastMessage || "Chưa có tin nhắn")}
                </span>
                {c.unreadCountForShop > 0 && <span className="seller-tab-badge">{c.unreadCountForShop}</span>}
              </button>
            ))
          ) : (
            <p className="seller-empty">Chưa có hội thoại nào.</p>
          )}
        </div>

        <div className="seller-chat-thread">
          {!activeConvId ? (
            <p className="seller-empty">Chọn một hội thoại để xem tin nhắn.</p>
          ) : (
            <>
              <div className="seller-chat-messages">
                {msgLoading ? (
                  <p className="seller-empty">Đang tải tin nhắn...</p>
                ) : messages.length ? (
                  messages.map((m) => (
                    <div key={m.id} className={`seller-chat-bubble${m.senderRole === "SHOP" ? " mine" : ""}`}>
                      {m.content && <p>{m.content}</p>}
                      {m.imageUrls?.length > 0 && (
                        <div className="seller-chat-bubble-images">
                          {m.imageUrls.map((url, i) => <img key={i} src={url} alt="" />)}
                        </div>
                      )}
                      <div className="seller-chat-bubble-meta">
                        <span>{m.sentAt ? new Date(m.sentAt).toLocaleString("vi-VN") : ""}</span>
                        {m.senderRole === "SHOP" && (
                          <button type="button" onClick={() => deleteMessage(m)}>Xoá</button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="seller-empty">Chưa có tin nhắn nào, hãy bắt đầu trò chuyện.</p>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="seller-chat-composer" onSubmit={sendMessage}>
                {pendingImages.length > 0 && (
                  <div className="seller-chat-pending-images">
                    {pendingImages.map((file, i) => (
                      <span key={i} className="seller-chat-pending-image">
                        {file.name}
                        <button type="button" onClick={() => removePendingImage(i)}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="seller-chat-composer-row">
                  <label className="btn-secondary btn-sm seller-chat-attach">
                    📎
                    <input type="file" accept="image/*" multiple hidden onChange={handleImagePick} />
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <button className="btn-primary btn-sm" disabled={sending || (!draft.trim() && !pendingImages.length)}>
                    {sending ? "Đang gửi..." : "Gửi"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}