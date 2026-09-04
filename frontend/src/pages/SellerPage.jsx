import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import SubNav from "../components/layout/SubNav";
import MobileNav from "../components/layout/MobileNav";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
import AddressAutocomplete from "../components/common/AddressAutocomplete";
import { sellerService } from "../services/sellerService";
import { useAuth } from "./Authcontext";
import { formatCurrency, formatDate } from "../utils/formatters";
import {
  Store,
  Package,
  ShoppingBag,
  Ticket,
  TrendingUp,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Truck,
  Settings,
  XCircle,
  Check,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  BarChart2,
  PieChart,
  AlertTriangle,
  Award,
  Flame,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

export default function SellerPage() {
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [checkingShop, setCheckingShop] = useState(true);

  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "products" | "orders" | "coupons" | "settings"
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL"); // "ALL" | "PENDING" | "PROCESSING" | "SHIPPING" | "DELIVERED" | "CANCELLED"
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Analytics & Charts State
  const [analyticsDays, setAnalyticsDays] = useState(7); // 7 or 30
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [hoveredBar, setHoveredBar] = useState(null);

  // Create Shop Onboarding Form
  const [creatingShop, setCreatingShop] = useState(false);
  const [createShopForm, setCreateShopForm] = useState({
    name: "",
    description: "",
    phone: "",
    address: "",
    logo: "",
    banner: "",
  });

  // Product Add/Edit Modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    categoryId: "dien-thoai",
    basePrice: "",
    originalPrice: "",
    stock: 50,
    description: "",
    imageUrl: "",
  });

  // Coupon Modal
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: "",
    discount: "",
    minOrder: "",
    expiry: "2026-12-31",
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchAnalytics = async (shopId, days = analyticsDays) => {
    if (!shopId) return;
    try {
      setLoadingAnalytics(true);
      const data = await sellerService.getAnalyticsOverview(shopId, days);
      setAnalyticsData(data);
    } catch (err) {
      console.error("Fetch analytics overview failed:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // 1. Fetch user shop and shop data
  const loadShopAndData = async () => {
    if (!user?.userId) {
      setCheckingShop(false);
      return;
    }

    try {
      setCheckingShop(true);
      const userShop = await sellerService.getShopByOwnerId(user.userId);

      if (userShop && userShop.id) {
        setShop(userShop);
        setLoading(true);
        const [sData, pData, oData, cData, aData] = await Promise.all([
          sellerService.getDashboardStats(userShop.id),
          sellerService.getProducts(userShop.id),
          sellerService.getOrders(userShop.id),
          sellerService.getCoupons(userShop.id),
          sellerService.getAnalyticsOverview(userShop.id, analyticsDays),
        ]);
        setStats(sData);
        setProducts(pData || []);
        setOrders(oData || []);
        setCoupons(cData || []);
        setAnalyticsData(aData);
      } else {
        setShop(null);
      }
    } catch (err) {
      console.error("Load shop info failed:", err);
      setShop(null);
    } finally {
      setCheckingShop(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShopAndData();
  }, [user?.userId]);

  const handleDaysChange = (days) => {
    setAnalyticsDays(days);
    if (shop?.id) {
      fetchAnalytics(shop.id, days);
    }
  };

  // Handle Create Shop
  const handleCreateShop = async (e) => {
    e.preventDefault();
    if (!createShopForm.name.trim() || !createShopForm.phone.trim()) {
      showToast("Vui lòng nhập tên gian hàng và số điện thoại!");
      return;
    }

    try {
      setCreatingShop(true);
      const newShop = await sellerService.createShop({
        name: createShopForm.name.trim(),
        description: createShopForm.description.trim() || "Chào mừng đến với gian hàng của chúng tôi!",
        phone: createShopForm.phone.trim(),
        address: createShopForm.address.trim() || "Việt Nam",
        logo: createShopForm.logo.trim() || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200",
        banner: createShopForm.banner.trim() || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
      });

      showToast("🎉 Chúc mừng bạn đã đăng ký mở gian hàng thành công!");
      await loadShopAndData();
    } catch (err) {
      showToast(err.message || "Không thể tạo gian hàng. Vui lòng thử lại!");
    } finally {
      setCreatingShop(false);
    }
  };

  // Handle Save Product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.basePrice || !shop?.id) {
      showToast("Vui lòng nhập tên và giá sản phẩm!");
      return;
    }

    const payload = {
      name: productForm.name,
      categoryId: productForm.categoryId,
      basePrice: Number(productForm.basePrice),
      originalPrice: Number(productForm.originalPrice) || Number(productForm.basePrice),
      description: productForm.description,
      images: [
        {
          id: "img-1",
          url: productForm.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
          isMain: true,
        },
      ],
      variants: [
        {
          sku: `SKU-${Date.now().toString().slice(-4)}`,
          name: "Tiêu chuẩn",
          price: Number(productForm.basePrice),
          stock: Number(productForm.stock) || 50,
          active: true,
        },
      ],
    };

    if (editingProduct) {
      await sellerService.updateProduct(shop.id, editingProduct.id, payload);
      showToast("Đã cập nhật sản phẩm thành công!");
    } else {
      await sellerService.createProduct(shop.id, payload);
      showToast("Đã thêm sản phẩm mới thành công!");
    }

    setProductModalOpen(false);
    setEditingProduct(null);
    await loadShopAndData();
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      await sellerService.deleteProduct(shop.id, id);
      showToast("Đã xóa sản phẩm thành công!");
      await loadShopAndData();
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    await sellerService.updateOrderStatus(shop.id, orderId, newStatus);
    const statusLabels = {
      PROCESSING: "Đang Chuẩn Bị Hàng",
      SHIPPING: "Đang Giao Cho Shipper",
      DELIVERED: "Giao Hàng Thành Công",
      CANCELLED: "Đã Hủy Đơn Hàng",
    };
    showToast(`Đã chuyển trạng thái đơn hàng sang: ${statusLabels[newStatus] || newStatus}`);
    await loadShopAndData();
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discount || !shop?.id) {
      showToast("Vui lòng nhập mã và số tiền giảm!");
      return;
    }
    await sellerService.createCoupon(shop.id, {
      code: couponForm.code.toUpperCase(),
      discount: Number(couponForm.discount),
      minOrder: Number(couponForm.minOrder) || 0,
      expiry: couponForm.expiry,
    });
    showToast("Đã tạo voucher khuyến mãi thành công!");
    setCouponModalOpen(false);
    await loadShopAndData();
  };

  // Filter orders by status
  const filteredOrders = orders.filter((o) => {
    const status = (o.orderStatus || "PENDING").toUpperCase();
    if (orderStatusFilter === "ALL") return true;
    if (orderStatusFilter === "PENDING") {
      return status === "PENDING" || status === "UNPAID" || status === "WAITING_PAYMENT";
    }
    if (orderStatusFilter === "PROCESSING") {
      return status === "PROCESSING" || status === "CONFIRMED";
    }
    if (orderStatusFilter === "SHIPPING") {
      return status === "SHIPPING";
    }
    if (orderStatusFilter === "DELIVERED") {
      return status === "DELIVERED" || status === "COMPLETED";
    }
    if (orderStatusFilter === "CANCELLED") {
      return status === "CANCELLED";
    }
    return true;
  });

  const countPending = orders.filter((o) =>
    ["PENDING", "UNPAID", "WAITING_PAYMENT"].includes((o.orderStatus || "").toUpperCase())
  ).length;
  const countProcessing = orders.filter((o) =>
    ["PROCESSING", "CONFIRMED"].includes((o.orderStatus || "").toUpperCase())
  ).length;
  const countShipping = orders.filter((o) => (o.orderStatus || "").toUpperCase() === "SHIPPING").length;
  const countDelivered = orders.filter((o) =>
    ["DELIVERED", "COMPLETED"].includes((o.orderStatus || "").toUpperCase())
  ).length;
  const countCancelled = orders.filter((o) => (o.orderStatus || "").toUpperCase() === "CANCELLED").length;

  return (
    <div className="page-shell">
      <Header />
      <SubNav activeTab="seller" />

      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            right: "20px",
            zIndex: 9999,
            backgroundColor: "#10b981",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "var(--r-md)",
            fontSize: "14px",
            fontWeight: "600",
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="page-content">
        <div className="container">
          {/* STATE 1: CHECKING / LOADING */}
          {checkingShop ? (
            <div style={{ padding: "60px 16px", textAlign: "center" }}>
              <div className="skeleton" style={{ width: "100%", height: "240px", borderRadius: "12px" }} />
              <div style={{ marginTop: "16px", color: "var(--text-secondary)", fontSize: "14px" }}>
                Đang kiểm tra thông tin gian hàng của bạn...
              </div>
            </div>
          ) : !user ? (
            /* STATE 2: NOT LOGGED IN */
            <div
              className="card"
              style={{
                padding: "60px 24px",
                textAlign: "center",
                backgroundColor: "var(--surface)",
                borderRadius: "var(--r-xl)",
                border: "1px solid var(--border-light)",
                maxWidth: "500px",
                margin: "40px auto",
              }}
            >
              <Store size={56} color="var(--primary)" style={{ margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "8px" }}>
                Kênh Người Bán DoMix
              </h2>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "24px" }}>
                Vui lòng đăng nhập để quản lý gian hàng và bán hàng trên DoMix.
              </p>
              <Button variant="primary" size="lg" block onClick={() => (window.location.href = "/login")}>
                Đăng Nhập Ngay
              </Button>
            </div>
          ) : !shop ? (
            /* STATE 3: LOGGED IN BUT NO SHOP YET -> ONBOARDING / CREATE SHOP FORM */
            <div
              style={{
                maxWidth: "760px",
                margin: "20px auto 60px",
              }}
            >
              {/* Hero Banner */}
              <div
                style={{
                  background: "linear-gradient(135deg, #ee4d2d 0%, #ff7a00 100%)",
                  borderRadius: "var(--r-xl)",
                  padding: "36px 32px",
                  color: "#ffffff",
                  marginBottom: "24px",
                  boxShadow: "0 10px 25px rgba(238, 77, 45, 0.25)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <Sparkles size={28} />
                  <h1 style={{ fontSize: "24px", fontWeight: "900" }}>
                    Trở Thành Người Bán Hàng Trên DoMix
                  </h1>
                </div>
                <p style={{ fontSize: "14px", opacity: 0.95, lineHeight: "1.6" }}>
                  Đăng ký gian hàng chỉ trong 1 phút để tiếp cận hàng triệu khách hàng tiềm năng, không phí duy trì, hỗ trợ vận chuyển toàn quốc!
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "12px",
                    marginTop: "20px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                    <ShieldCheck size={18} /> <span>Bảo vệ quyền lợi 100%</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                    <Truck size={18} /> <span>Tích hợp sẵn Shipper</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                    <UserCheck size={18} /> <span>Duyệt mở shop ngay</span>
                  </div>
                </div>
              </div>

              {/* Registration Form */}
              <div
                className="card"
                style={{
                  padding: "32px",
                  backgroundColor: "var(--surface)",
                  borderRadius: "var(--r-xl)",
                  border: "1px solid var(--border-light)",
                  boxShadow: "var(--shadow-md)",
                }}
              >
                <h2 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "20px", color: "var(--text)" }}>
                  Thông Tin Đăng Ký Gian Hàng
                </h2>

                <form onSubmit={handleCreateShop} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                      Tên Gian Hàng / Tên Shop <span style={{ color: "var(--error)" }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: DoMix Official Store, Shop Thời Trang..."
                      value={createShopForm.name}
                      onChange={(e) => setCreateShopForm({ ...createShopForm, name: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--r-md)",
                        fontSize: "14px",
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={{ fontSize: "13px", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                        Số Điện Thoại Shop <span style={{ color: "var(--error)" }}>*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="0912 345 678"
                        value={createShopForm.phone}
                        onChange={(e) => setCreateShopForm({ ...createShopForm, phone: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--r-md)",
                          fontSize: "14px",
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "13px", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                        Logo Shop (URL Hình Ảnh)
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={createShopForm.logo}
                        onChange={(e) => setCreateShopForm({ ...createShopForm, logo: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--r-md)",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "13px", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                      Địa Chỉ Kho / Cửa Hàng (Gợi ý bản đồ)
                    </label>
                    <AddressAutocomplete
                      value={createShopForm.address}
                      onChange={(val) => setCreateShopForm((prev) => ({ ...prev, address: val }))}
                      onPlaceSelect={(place) => {
                        setCreateShopForm((prev) => ({
                          ...prev,
                          address: place.formattedAddress || place.detail,
                        }));
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "13px", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                      Mô Tả Ngắn Về Shop
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Mô tả ngành hàng, cam kết sản phẩm chính hãng..."
                      value={createShopForm.description}
                      onChange={(e) => setCreateShopForm({ ...createShopForm, description: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--r-md)",
                        fontSize: "14px",
                      }}
                    />
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    block
                    loading={creatingShop}
                    style={{ marginTop: "10px" }}
                  >
                    Hoàn Tất Đăng Ký & Mở Shop
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            /* STATE 4: USER HAS A SHOP -> FULL SELLER CENTER DASHBOARD */
            <>
              {/* Seller Center Header */}
              <div
                className="card"
                style={{
                  padding: "20px 24px",
                  backgroundColor: "var(--surface)",
                  borderRadius: "var(--r-lg)",
                  border: "1px solid var(--border-light)",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <img
                    src={shop.logo || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"}
                    alt={shop.name}
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid var(--primary-light)",
                    }}
                  />
                  <div>
                    <h1 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text)" }}>
                      {shop.name}
                    </h1>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      Mã Shop: <strong>{shop.id}</strong> | Đánh giá: ⭐ {shop.rating || stats?.rating || 5.0}/5.0
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({
                      name: "",
                      categoryId: "dien-thoai",
                      basePrice: "",
                      originalPrice: "",
                      stock: 50,
                      description: "",
                      imageUrl: "",
                    });
                    setProductModalOpen(true);
                  }}
                >
                  Thêm Sản Phẩm Mới
                </Button>
              </div>

              {/* Navigation Tabs */}
              <div
                className="card"
                style={{
                  display: "flex",
                  backgroundColor: "var(--surface)",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--border-light)",
                  marginBottom: "20px",
                  overflowX: "auto",
                }}
              >
                {[
                  { id: "dashboard", label: "📊 Tổng Quan", icon: TrendingUp },
                  { id: "products", label: `📦 Sản Phẩm (${products.length})`, icon: Package },
                  { id: "orders", label: `📑 Đơn Hàng (${orders.length})`, icon: ShoppingBag },
                  { id: "coupons", label: `🎟️ Mã Giảm Giá (${coupons.length})`, icon: Ticket },
                  { id: "settings", label: "⚙️ Cài Đặt Shop", icon: Settings },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1,
                      padding: "14px 16px",
                      border: "none",
                      borderBottom: activeTab === tab.id ? "3px solid var(--primary)" : "3px solid transparent",
                      backgroundColor: "transparent",
                      color: activeTab === tab.id ? "var(--primary)" : "var(--text)",
                      fontWeight: activeTab === tab.id ? "700" : "500",
                      fontSize: "14px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: DASHBOARD & ANALYTICS */}
              {activeTab === "dashboard" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {/* Dashboard Header with Time Filter */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "12px",
                      padding: "16px 20px",
                      backgroundColor: "var(--surface)",
                      borderRadius: "var(--r-lg)",
                      border: "1px solid var(--border-light)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          backgroundColor: "var(--primary-light)",
                          color: "var(--primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <BarChart2 size={20} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text)", margin: 0 }}>
                          THỐNG KÊ HOẠT ĐỘNG GIAN HÀNG
                        </h2>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                          Cập nhật theo thời gian thực từ hệ thống
                        </div>
                      </div>
                    </div>

                    {/* Time Range Filter Toggle */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        onClick={() => handleDaysChange(7)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "var(--r-sm)",
                          border: analyticsDays === 7 ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                          backgroundColor: analyticsDays === 7 ? "var(--primary-light)" : "var(--surface)",
                          color: analyticsDays === 7 ? "var(--primary)" : "var(--text)",
                          fontWeight: analyticsDays === 7 ? "700" : "500",
                          fontSize: "12.5px",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        7 Ngày Gần Nhất
                      </button>

                      <button
                        onClick={() => handleDaysChange(30)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "var(--r-sm)",
                          border: analyticsDays === 30 ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                          backgroundColor: analyticsDays === 30 ? "var(--primary-light)" : "var(--surface)",
                          color: analyticsDays === 30 ? "var(--primary)" : "var(--text)",
                          fontWeight: analyticsDays === 30 ? "700" : "500",
                          fontSize: "12.5px",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        30 Ngày Gần Nhất
                      </button>

                      <button
                        onClick={() => shop?.id && fetchAnalytics(shop.id, analyticsDays)}
                        title="Làm mới số liệu"
                        style={{
                          padding: "7px 10px",
                          borderRadius: "var(--r-sm)",
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--surface)",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <RefreshCw size={14} className={loadingAnalytics ? "spin" : ""} />
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {/* Revenue Card */}
                    <div
                      className="card"
                      style={{
                        padding: "20px",
                        backgroundColor: "#fff",
                        borderRadius: "var(--r-lg)",
                        borderLeft: "4px solid var(--primary)",
                      }}
                    >
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>
                        Tổng Doanh Thu
                      </div>
                      <div style={{ fontSize: "22px", fontWeight: "900", color: "var(--primary)", marginTop: "6px" }}>
                        {formatCurrency(analyticsData?.summary?.revenue ?? stats?.totalRevenue ?? 0)}
                      </div>
                      <div style={{ fontSize: "11px", color: "#059669", marginTop: "4px", display: "flex", alignItems: "center", gap: "3px" }}>
                        <TrendingUp size={12} />
                        <span>Trong {analyticsDays} ngày qua</span>
                      </div>
                    </div>

                    {/* Order Count Card */}
                    <div
                      className="card"
                      style={{
                        padding: "20px",
                        backgroundColor: "#fff",
                        borderRadius: "var(--r-lg)",
                        borderLeft: "4px solid #0284c7",
                      }}
                    >
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>
                        Tổng Số Đơn Hàng
                      </div>
                      <div style={{ fontSize: "22px", fontWeight: "900", color: "#0284c7", marginTop: "6px" }}>
                        {analyticsData?.summary?.orderCount ?? orders.length} đơn
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                        {countPending} đơn đang chờ duyệt
                      </div>
                    </div>

                    {/* Total Sales Units Card */}
                    <div
                      className="card"
                      style={{
                        padding: "20px",
                        backgroundColor: "#fff",
                        borderRadius: "var(--r-lg)",
                        borderLeft: "4px solid #8b5cf6",
                      }}
                    >
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>
                        Sản Phẩm Đã Bán
                      </div>
                      <div style={{ fontSize: "22px", fontWeight: "900", color: "#8b5cf6", marginTop: "6px" }}>
                        {analyticsData?.summary?.totalSales ?? 0} sản phẩm
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                        Đã giao thành công
                      </div>
                    </div>

                    {/* Shop Rating Card */}
                    <div
                      className="card"
                      style={{
                        padding: "20px",
                        backgroundColor: "#fff",
                        borderRadius: "var(--r-lg)",
                        borderLeft: "4px solid #f59e0b",
                      }}
                    >
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>
                        Đánh Giá Shop
                      </div>
                      <div style={{ fontSize: "22px", fontWeight: "900", color: "#f59e0b", marginTop: "6px" }}>
                        ⭐ {Number(analyticsData?.summary?.averageRating ?? stats?.rating ?? 5.0).toFixed(1)} / 5.0
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                        Tỉ lệ phản hồi chat: {stats?.responseRate || "100%"}
                      </div>
                    </div>

                    {/* Active Products Card */}
                    <div
                      className="card"
                      style={{
                        padding: "20px",
                        backgroundColor: "#fff",
                        borderRadius: "var(--r-lg)",
                        borderLeft: "4px solid #10b981",
                      }}
                    >
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>
                        Sản Phẩm Đang Bán
                      </div>
                      <div style={{ fontSize: "22px", fontWeight: "900", color: "#10b981", marginTop: "6px" }}>
                        {analyticsData?.summary?.productCount ?? products.length} mặt hàng
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                        {analyticsData?.lowStockAlerts?.length || 0} biến thể sắp hết kho
                      </div>
                    </div>
                  </div>

                  {/* To-Do List Checklist */}
                  <div
                    className="card"
                    style={{
                      padding: "20px 24px",
                      backgroundColor: "var(--surface)",
                      borderRadius: "var(--r-lg)",
                      border: "1px solid var(--border-light)",
                    }}
                  >
                    <h3 style={{ fontSize: "15px", fontWeight: "800", marginBottom: "14px", color: "var(--text)" }}>
                      Danh Sách Việc Cần Làm (Bấm để xử lý ngay)
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                        gap: "12px",
                      }}
                    >
                      <div
                        onClick={() => {
                          setOrderStatusFilter("PENDING");
                          setActiveTab("orders");
                        }}
                        style={{
                          padding: "14px",
                          backgroundColor: "var(--primary-light)",
                          borderRadius: "8px",
                          border: "1px solid var(--border-primary)",
                          textAlign: "center",
                          cursor: "pointer",
                          transition: "transform 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        <strong style={{ fontSize: "22px", color: "var(--primary)", display: "block" }}>
                          {countPending}
                        </strong>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)" }}>Chờ Xác Nhận</span>
                        <div style={{ fontSize: "11px", color: "var(--primary)", marginTop: "2px" }}>Bấm để duyệt đơn →</div>
                      </div>

                      <div
                        onClick={() => {
                          setOrderStatusFilter("PROCESSING");
                          setActiveTab("orders");
                        }}
                        style={{
                          padding: "14px",
                          backgroundColor: "var(--surface-muted)",
                          borderRadius: "8px",
                          border: "1px solid var(--border)",
                          textAlign: "center",
                          cursor: "pointer",
                          transition: "transform 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        <strong style={{ fontSize: "22px", color: "var(--info)", display: "block" }}>
                          {countProcessing}
                        </strong>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)" }}>Đang Chuẩn Bị</span>
                        <div style={{ fontSize: "11px", color: "var(--info)", marginTop: "2px" }}>Bàn giao shipper →</div>
                      </div>

                      <div
                        onClick={() => {
                          setOrderStatusFilter("SHIPPING");
                          setActiveTab("orders");
                        }}
                        style={{
                          padding: "14px",
                          backgroundColor: "#ecfdf5",
                          borderRadius: "8px",
                          border: "1px solid #a7f3d0",
                          textAlign: "center",
                          cursor: "pointer",
                          transition: "transform 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        <strong style={{ fontSize: "22px", color: "#059669", display: "block" }}>
                          {countShipping}
                        </strong>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)" }}>Đang Giao Hàng</span>
                        <div style={{ fontSize: "11px", color: "#059669", marginTop: "2px" }}>Theo dõi lộ trình →</div>
                      </div>

                      <div
                        onClick={() => (window.location.href = "/refunds")}
                        style={{
                          padding: "14px",
                          backgroundColor: "#fff7ed",
                          borderRadius: "8px",
                          border: "1px solid #fed7aa",
                          textAlign: "center",
                          cursor: "pointer",
                          transition: "transform 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        <strong style={{ fontSize: "22px", color: "#ea580c", display: "block" }}>
                          {analyticsData?.orderStatusDistribution?.statusCounts?.REFUNDED || 0}
                        </strong>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)" }}>Yêu Cầu Hoàn Tiền</span>
                        <div style={{ fontSize: "11px", color: "#ea580c", marginTop: "2px" }}>Xử lý khiếu nại →</div>
                      </div>
                    </div>
                  </div>

                  {/* CHARTS SECTION (2 COLUMNS: REVENUE TREND + ORDER STATUS BREAKDOWN) */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {/* CHART 1: Biểu đồ Doanh Thu & Số Đơn Theo Ngày */}
                    <div
                      className="card"
                      style={{
                        padding: "22px",
                        backgroundColor: "var(--surface)",
                        borderRadius: "var(--r-lg)",
                        border: "1px solid var(--border-light)",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <BarChart2 size={18} color="var(--primary)" />
                          <strong style={{ fontSize: "15px", color: "var(--text)" }}>
                            Biểu Đồ Doanh Thu & Đơn Hàng ({analyticsDays} Ngày)
                          </strong>
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", fontWeight: "600" }}>
                          Cột: Doanh thu | Chấm: Đơn
                        </div>
                      </div>

                      {/* SVG Bar & Trend Chart */}
                      {(() => {
                        const chartList = analyticsData?.revenueChart || [];
                        if (chartList.length === 0) {
                          return (
                            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: "13px" }}>
                              Chưa có dữ liệu giao dịch trong khoảng thời gian này.
                            </div>
                          );
                        }

                        const maxRevenue = Math.max(...chartList.map((d) => d.revenue || 0), 1000000);
                        const totalPeriodRevenue = chartList.reduce((sum, d) => sum + (d.revenue || 0), 0);
                        const totalPeriodOrders = chartList.reduce((sum, d) => sum + (d.orderCount || 0), 0);

                        return (
                          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                            {/* Chart Bars Grid */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-end",
                                gap: "8px",
                                height: "200px",
                                padding: "10px 0 30px",
                                borderBottom: "1px solid var(--border-light)",
                                position: "relative",
                              }}
                            >
                              {chartList.map((item, idx) => {
                                const rev = item.revenue || 0;
                                const ordersCount = item.orderCount || 0;
                                const heightPercent = Math.max(8, Math.round((rev / maxRevenue) * 100));
                                const dateLabel = (item.date || "").split("-").slice(1).join("/");
                                const isHovered = hoveredBar === idx;

                                return (
                                  <div
                                    key={idx}
                                    onMouseEnter={() => setHoveredBar(idx)}
                                    onMouseLeave={() => setHoveredBar(null)}
                                    style={{
                                      flex: 1,
                                      height: "100%",
                                      display: "flex",
                                      flexDirection: "column",
                                      justifyContent: "flex-end",
                                      alignItems: "center",
                                      position: "relative",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {/* Tooltip on hover */}
                                    {isHovered && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          bottom: `calc(${heightPercent}% + 12px)`,
                                          backgroundColor: "rgba(17, 24, 39, 0.95)",
                                          color: "#fff",
                                          padding: "8px 12px",
                                          borderRadius: "6px",
                                          fontSize: "11px",
                                          whiteSpace: "nowrap",
                                          zIndex: 100,
                                          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                                          pointerEvents: "none",
                                          textAlign: "center",
                                        }}
                                      >
                                        <div style={{ fontWeight: "700", color: "#fca5a5" }}>{item.date}</div>
                                        <div>Doanh thu: <strong>{formatCurrency(rev)}</strong></div>
                                        <div>Số đơn hàng: <strong>{ordersCount} đơn</strong></div>
                                      </div>
                                    )}

                                    {/* Order dot indicator */}
                                    {ordersCount > 0 && (
                                      <div
                                        style={{
                                          width: "8px",
                                          height: "8px",
                                          borderRadius: "50%",
                                          backgroundColor: "#f59e0b",
                                          marginBottom: "4px",
                                          boxShadow: "0 0 0 2px #fff",
                                        }}
                                        title={`${ordersCount} đơn hàng`}
                                      />
                                    )}

                                    {/* Bar Pillar */}
                                    <div
                                      style={{
                                        width: "100%",
                                        maxWidth: "36px",
                                        height: `${heightPercent}%`,
                                        backgroundColor: isHovered ? "var(--primary)" : "rgba(238, 77, 45, 0.75)",
                                        borderRadius: "4px 4px 0 0",
                                        transition: "all 0.2s",
                                        transform: isHovered ? "scaleY(1.04)" : "scaleY(1)",
                                        transformOrigin: "bottom",
                                      }}
                                    />

                                    {/* Date Label */}
                                    <span
                                      style={{
                                        position: "absolute",
                                        bottom: "-24px",
                                        fontSize: "10.5px",
                                        fontWeight: isHovered ? "800" : "500",
                                        color: isHovered ? "var(--primary)" : "var(--text-tertiary)",
                                      }}
                                    >
                                      {dateLabel}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Chart Footer stats */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginTop: "16px",
                                paddingTop: "10px",
                                fontSize: "12px",
                                color: "var(--text-secondary)",
                              }}
                            >
                              <div>
                                <span>Tổng {analyticsDays} ngày: </span>
                                <strong style={{ color: "var(--primary)", fontWeight: "800" }}>
                                  {formatCurrency(totalPeriodRevenue)}
                                </strong>
                              </div>
                              <div>
                                <span>Tổng số đơn: </span>
                                <strong style={{ color: "#0284c7", fontWeight: "800" }}>
                                  {totalPeriodOrders} đơn
                                </strong>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* CHART 2: Biểu Đồ Phân Bố Trạng Thái Đơn Hàng */}
                    <div
                      className="card"
                      style={{
                        padding: "22px",
                        backgroundColor: "var(--surface)",
                        borderRadius: "var(--r-lg)",
                        border: "1px solid var(--border-light)",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <PieChart size={18} color="#0284c7" />
                          <strong style={{ fontSize: "15px", color: "var(--text)" }}>
                            Phân Bố Trạng Thái Đơn Hàng
                          </strong>
                        </div>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>
                          Tổng {analyticsData?.orderStatusDistribution?.totalOrders || orders.length} đơn
                        </span>
                      </div>

                      {/* Status Progress Bars */}
                      {(() => {
                        const statusCounts = analyticsData?.orderStatusDistribution?.statusCounts || {
                          PENDING: countPending,
                          PROCESSING: countProcessing,
                          SHIPPING: countShipping,
                          COMPLETED: orders.filter((o) => (o.orderStatus || "").toUpperCase() === "DELIVERED").length,
                          CANCELED: orders.filter((o) => (o.orderStatus || "").toUpperCase() === "CANCELED").length,
                          REFUNDED: 0,
                        };

                        const total = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;

                        const statusConfig = [
                          { key: "COMPLETED", label: "Đã hoàn thành / Đã giao", color: "#10b981", bg: "#ecfdf5", count: statusCounts.COMPLETED || 0 },
                          { key: "SHIPPING", label: "Đang giao hàng", color: "#0284c7", bg: "#e0f2fe", count: statusCounts.SHIPPING || 0 },
                          { key: "PROCESSING", label: "Đang chuẩn bị hàng", color: "#6366f1", bg: "#eef2ff", count: statusCounts.PROCESSING || 0 },
                          { key: "PENDING", label: "Chờ xác nhận", color: "#f59e0b", bg: "#fef3c7", count: statusCounts.PENDING || 0 },
                          { key: "CANCELED", label: "Đã hủy", color: "#ef4444", bg: "#fef2f2", count: statusCounts.CANCELED || 0 },
                          { key: "REFUNDED", label: "Trả hàng / Hoàn tiền", color: "#ea580c", bg: "#fff7ed", count: statusCounts.REFUNDED || 0 },
                        ];

                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, justifyContent: "center" }}>
                            {statusConfig.map((item) => {
                              const pct = Math.round((item.count / total) * 100);
                              return (
                                <div
                                  key={item.key}
                                  onClick={() => {
                                    setOrderStatusFilter(item.key === "COMPLETED" ? "DELIVERED" : item.key);
                                    setActiveTab("orders");
                                  }}
                                  style={{ cursor: "pointer", transition: "transform 0.1s" }}
                                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateX(4px)")}
                                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateX(0)")}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "4px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: item.color }} />
                                      <span style={{ fontWeight: "600", color: "var(--text)" }}>{item.label}</span>
                                    </div>
                                    <div style={{ fontWeight: "700", color: "var(--text)" }}>
                                      {item.count} đơn <span style={{ color: "var(--text-tertiary)", fontWeight: "400" }}>({pct}%)</span>
                                    </div>
                                  </div>

                                  {/* Progress bar line */}
                                  <div style={{ width: "100%", height: "7px", borderRadius: "99px", backgroundColor: "var(--border-light)", overflow: "hidden" }}>
                                    <div
                                      style={{
                                        width: `${pct}%`,
                                        height: "100%",
                                        backgroundColor: item.color,
                                        borderRadius: "99px",
                                        transition: "width 0.5s ease-out",
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* INSIGHTS SECTION (2 COLUMNS: TOP PRODUCTS LEADERBOARD + LOW STOCK ALERTS) */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr)))",
                      gap: "20px",
                    }}
                  >
                    {/* COLUMN 1: Top 5 Sản Phẩm Bán Chạy Nhất */}
                    <div
                      className="card"
                      style={{
                        padding: "22px",
                        backgroundColor: "var(--surface)",
                        borderRadius: "var(--r-lg)",
                        border: "1px solid var(--border-light)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Flame size={18} color="var(--primary)" />
                          <strong style={{ fontSize: "15px", color: "var(--text)" }}>
                            Top 5 Sản Phẩm Bán Chạy Nhất
                          </strong>
                        </div>
                        <span style={{ fontSize: "11.5px", color: "var(--primary)", fontWeight: "700" }}>
                          Xếp hạng theo lượt bán
                        </span>
                      </div>

                      {/* Top Products Table / List */}
                      {(() => {
                        const topList = analyticsData?.topProducts || [];
                        if (topList.length === 0) {
                          return (
                            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: "13px" }}>
                              Chưa có sản phẩm nào phát sinh lượt bán.
                            </div>
                          );
                        }

                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {topList.map((prod, idx) => {
                              const rankMedal = idx === 0 ? "🥇 #1" : idx === 1 ? "🥈 #2" : idx === 2 ? "🥉 #3" : `#${idx + 1}`;
                              const rankBg = idx === 0 ? "#fef3c7" : idx === 1 ? "#f3f4f6" : idx === 2 ? "#fed7aa" : "var(--surface-muted)";
                              const rankColor = idx === 0 ? "#b45309" : idx === 1 ? "#4b5563" : idx === 2 ? "#c2410c" : "var(--text-secondary)";

                              return (
                                <div
                                  key={prod.productId || idx}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "10px 14px",
                                    backgroundColor: "var(--surface)",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border-light)",
                                    transition: "background 0.15s",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-muted)")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--surface)")}
                                >
                                  {/* Rank Badge */}
                                  <span
                                    style={{
                                      padding: "3px 8px",
                                      borderRadius: "6px",
                                      fontSize: "11px",
                                      fontWeight: "800",
                                      backgroundColor: rankBg,
                                      color: rankColor,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {rankMedal}
                                  </span>

                                  {/* Product Thumbnail */}
                                  <img
                                    src={prod.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"}
                                    alt={prod.productName}
                                    style={{
                                      width: "44px",
                                      height: "44px",
                                      borderRadius: "6px",
                                      objectFit: "cover",
                                      border: "1px solid var(--border)",
                                      flexShrink: 0,
                                    }}
                                  />

                                  {/* Product Name & Price */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: "13px",
                                        fontWeight: "700",
                                        color: "var(--text)",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {prod.productName}
                                    </div>
                                    <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                                      Giá: {formatCurrency(prod.basePrice || 0)}
                                    </div>
                                  </div>

                                  {/* Sold Count & Revenue */}
                                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                                    <div style={{ fontSize: "13px", fontWeight: "800", color: "var(--primary)" }}>
                                      {prod.soldCount || 0} đã bán
                                    </div>
                                    <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2px" }}>
                                      Doanh thu: {formatCurrency(prod.revenue || 0)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* COLUMN 2: Cảnh Báo Tồn Kho Sắp Hết (Low Stock Alerts) */}
                    <div
                      className="card"
                      style={{
                        padding: "22px",
                        backgroundColor: "var(--surface)",
                        borderRadius: "var(--r-lg)",
                        border: "1px solid var(--border-light)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <AlertTriangle size={18} color="#eab308" />
                          <strong style={{ fontSize: "15px", color: "var(--text)" }}>
                            Cảnh Báo Tồn Kho Sắp Hết (≤ 5 Cái)
                          </strong>
                        </div>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "99px",
                            backgroundColor: "#fef3c7",
                            color: "#b45309",
                            fontSize: "11px",
                            fontWeight: "800",
                          }}
                        >
                          {analyticsData?.lowStockAlerts?.length || 0} cảnh báo
                        </span>
                      </div>

                      {/* Low Stock Items List */}
                      {(() => {
                        const lowStockList = analyticsData?.lowStockAlerts || [];
                        if (lowStockList.length === 0) {
                          return (
                            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                              <CheckCircle size={32} color="#10b981" style={{ margin: "0 auto 8px" }} />
                              <div>Tất cả các biến thể kho hàng đều đang có số lượng dồi dào!</div>
                            </div>
                          );
                        }

                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {lowStockList.map((item, idx) => {
                              const isOutOfStock = Number(item.stock) === 0;

                              return (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "12px 14px",
                                    backgroundColor: isOutOfStock ? "#fef2f2" : "#fffbeb",
                                    borderRadius: "8px",
                                    border: isOutOfStock ? "1px solid #fecaca" : "1px solid #fef08a",
                                  }}
                                >
                                  <div style={{ minWidth: 0, flex: 1, paddingRight: "10px" }}>
                                    <div
                                      style={{
                                        fontSize: "13px",
                                        fontWeight: "700",
                                        color: "var(--text)",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {item.productName}
                                    </div>
                                    <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "3px" }}>
                                      SKU: <strong style={{ color: "var(--text)" }}>{item.sku || "Mặc định"}</strong>
                                      {item.color && <span> | Màu: {item.color}</span>}
                                      {item.size && <span> | Size: {item.size}</span>}
                                    </div>
                                  </div>

                                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                                    <span
                                      style={{
                                        padding: "4px 8px",
                                        borderRadius: "6px",
                                        fontSize: "11.5px",
                                        fontWeight: "800",
                                        backgroundColor: isOutOfStock ? "#ef4444" : "#f59e0b",
                                        color: "#fff",
                                      }}
                                    >
                                      {isOutOfStock ? "HẾT HÀNG" : `Còn ${item.stock} cái`}
                                    </span>

                                    <button
                                      onClick={() => {
                                        setActiveTab("products");
                                      }}
                                      style={{
                                        fontSize: "11.5px",
                                        fontWeight: "700",
                                        color: "var(--primary)",
                                        backgroundColor: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        textDecoration: "underline",
                                      }}
                                    >
                                      Nhập kho →
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PRODUCTS MANAGER */}
              {activeTab === "products" && (
                <div
                  className="card"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderRadius: "var(--r-lg)",
                    border: "1px solid var(--border-light)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "18px 20px",
                      borderBottom: "1px solid var(--border-light)",
                    }}
                  >
                    <strong style={{ fontSize: "16px" }}>Danh Sách Sản Phẩm ({products.length})</strong>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Plus}
                      onClick={() => {
                        setEditingProduct(null);
                        setProductForm({
                          name: "",
                          categoryId: "dien-thoai",
                          basePrice: "",
                          originalPrice: "",
                          stock: 50,
                          description: "",
                          imageUrl: "",
                        });
                        setProductModalOpen(true);
                      }}
                    >
                      Thêm Sản Phẩm
                    </Button>
                  </div>

                  {products.length === 0 ? (
                    <EmptyState
                      title="Shop chưa có sản phẩm nào"
                      description="Hãy bấm 'Thêm Sản Phẩm' để đăng bán mặt hàng đầu tiên của bạn!"
                    />
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                          <tr style={{ backgroundColor: "var(--surface-muted)", textAlign: "left" }}>
                            <th style={{ padding: "12px 16px" }}>Sản phẩm</th>
                            <th style={{ padding: "12px 16px" }}>Giá bán</th>
                            <th style={{ padding: "12px 16px" }}>Tồn kho</th>
                            <th style={{ padding: "12px 16px" }}>Đã bán</th>
                            <th style={{ padding: "12px 16px" }}>Trạng thái</th>
                            <th style={{ padding: "12px 16px", textAlign: "right" }}>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((p) => (
                            <tr key={p.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                              <td style={{ padding: "12px 16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <img
                                    src={p.images?.[0]?.url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"}
                                    alt={p.name}
                                    style={{ width: "42px", height: "42px", borderRadius: "4px", objectFit: "cover" }}
                                  />
                                  <div>
                                    <strong style={{ color: "var(--text)" }}>{p.name}</strong>
                                    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                                      Mã: {p.id}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: "12px 16px", fontWeight: "700", color: "var(--primary)" }}>
                                {formatCurrency(p.basePrice)}
                              </td>
                              <td style={{ padding: "12px 16px" }}>{p.variants?.[0]?.stock || p.stock || 50}</td>
                              <td style={{ padding: "12px 16px" }}>{p.soldCount || 0}</td>
                              <td style={{ padding: "12px 16px" }}>
                                <span
                                  style={{
                                    backgroundColor: "#d1fae5",
                                    color: "#065f46",
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                  }}
                                >
                                  Đang bán
                                </span>
                              </td>
                              <td style={{ padding: "12px 16px", textAlign: "right" }}>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                  <button
                                    onClick={() => {
                                      setEditingProduct(p);
                                      setProductForm({
                                        name: p.name,
                                        categoryId: p.categoryId || "dien-thoai",
                                        basePrice: p.basePrice,
                                        originalPrice: p.originalPrice || p.basePrice,
                                        stock: p.variants?.[0]?.stock || 50,
                                        description: p.description || "",
                                        imageUrl: p.images?.[0]?.url || "",
                                      });
                                      setProductModalOpen(true);
                                    }}
                                    style={{ padding: "6px", color: "var(--text-secondary)" }}
                                    title="Chỉnh sửa"
                                  >
                                    <Edit2 size={15} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    style={{ padding: "6px", color: "var(--error)" }}
                                    title="Xóa"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ORDERS MANAGER */}
              {activeTab === "orders" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Order Status Sub-Tabs Filter */}
                  <div
                    className="card"
                    style={{
                      display: "flex",
                      backgroundColor: "var(--surface)",
                      borderRadius: "var(--r-md)",
                      border: "1px solid var(--border-light)",
                      overflowX: "auto",
                    }}
                  >
                    {[
                      { id: "ALL", label: `Tất Cả (${orders.length})` },
                      { id: "PENDING", label: `Chờ Xác Nhận (${countPending})` },
                      { id: "PROCESSING", label: `Đang Chuẩn Bị (${countProcessing})` },
                      { id: "SHIPPING", label: `Đang Giao (${countShipping})` },
                      { id: "DELIVERED", label: `Đã Giao (${countDelivered})` },
                      { id: "CANCELLED", label: `Đã Hủy (${countCancelled})` },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setOrderStatusFilter(st.id)}
                        style={{
                          flex: 1,
                          padding: "12px 14px",
                          border: "none",
                          borderBottom: orderStatusFilter === st.id ? "2.5px solid var(--primary)" : "2.5px solid transparent",
                          backgroundColor: "transparent",
                          color: orderStatusFilter === st.id ? "var(--primary)" : "var(--text)",
                          fontWeight: orderStatusFilter === st.id ? "800" : "500",
                          fontSize: "13px",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {filteredOrders.length === 0 ? (
                    <EmptyState
                      title="Không có đơn hàng nào trong mục này"
                      description="Các đơn hàng mới của shop sẽ xuất hiện tại đây."
                    />
                  ) : (
                    filteredOrders.map((o) => {
                      const status = (o.orderStatus || "PENDING").toUpperCase();
                      const buyerName = o.shippingAddress?.fullName || o.recipient?.name || o.buyerId || "Khách Hàng";
                      const buyerPhone = o.shippingAddress?.phone || o.recipient?.phone || "0912 345 678";
                      const buyerAddress = o.shippingAddress?.detail || o.recipient?.address || "Hồ Chí Minh";
                      const total = o.totalAmount || o.subtotal || 0;

                      return (
                        <div
                          key={o.id}
                          className="card"
                          style={{
                            padding: "20px",
                            backgroundColor: "var(--surface)",
                            borderRadius: "var(--r-lg)",
                            border: "1px solid var(--border-light)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              paddingBottom: "12px",
                              borderBottom: "1px solid var(--border-light)",
                              marginBottom: "12px",
                              flexWrap: "wrap",
                              gap: "8px",
                            }}
                          >
                            <div>
                              <strong style={{ fontSize: "15px", color: "var(--text)" }}>
                                Đơn #{o.orderCode || o.id}
                              </strong>
                              <span style={{ fontSize: "12px", color: "var(--text-secondary)", marginLeft: "10px" }}>
                                Khách: <strong>{buyerName}</strong> ({buyerPhone})
                              </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span
                                style={{
                                  padding: "3px 10px",
                                  borderRadius: "99px",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  backgroundColor:
                                    status === "PENDING"
                                      ? "var(--primary-light)"
                                      : status === "PROCESSING"
                                      ? "#e0f2fe"
                                      : status === "SHIPPING"
                                      ? "#ecfdf5"
                                      : status === "DELIVERED"
                                      ? "#dcfce7"
                                      : "#fee2e2",
                                  color:
                                    status === "PENDING"
                                      ? "var(--primary)"
                                      : status === "PROCESSING"
                                      ? "#0284c7"
                                      : status === "SHIPPING"
                                      ? "#059669"
                                      : status === "DELIVERED"
                                      ? "#16a34a"
                                      : "#dc2626",
                                }}
                              >
                                {status === "PENDING"
                                  ? "⏳ Chờ xác nhận"
                                  : status === "PROCESSING"
                                  ? "📦 Đang chuẩn bị"
                                  : status === "SHIPPING"
                                  ? "🚚 Đang giao hàng"
                                  : status === "DELIVERED"
                                  ? "✓ Giao thành công"
                                  : "✕ Đã hủy"}
                              </span>
                            </div>
                          </div>

                          {/* Items */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
                            {(o.items || []).map((it, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: "13px",
                                  alignItems: "center",
                                }}
                              >
                                <span>
                                  • {it.productName || it.productId} (x{it.quantity || 1})
                                </span>
                                <strong>{formatCurrency((it.unitPrice || it.price || 0) * (it.quantity || 1))}</strong>
                              </div>
                            ))}
                          </div>

                          {/* Footer Actions */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              paddingTop: "12px",
                              borderTop: "1px solid var(--border-light)",
                              flexWrap: "wrap",
                              gap: "12px",
                            }}
                          >
                            <div style={{ fontSize: "13px" }}>
                              <div>
                                Địa chỉ giao: <span style={{ color: "var(--text-secondary)" }}>{buyerAddress}</span>
                              </div>
                              <div style={{ marginTop: "2px" }}>
                                Tổng tiền: <strong style={{ color: "var(--primary)", fontSize: "14px" }}>{formatCurrency(total)}</strong>
                              </div>
                            </div>

                            {/* Dynamic Action Buttons based on status */}
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              {(status === "PENDING" || status === "UNPAID") && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateOrderStatus(o.id, "CANCELLED")}
                                  >
                                    Hủy Đơn
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    icon={Check}
                                    onClick={() => handleUpdateOrderStatus(o.id, "PROCESSING")}
                                  >
                                    Xác Nhận Đơn Hàng
                                  </Button>
                                </>
                              )}

                              {(status === "PROCESSING" || status === "CONFIRMED") && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateOrderStatus(o.id, "CANCELLED")}
                                  >
                                    Hủy Đơn
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    icon={Truck}
                                    onClick={() => handleUpdateOrderStatus(o.id, "SHIPPING")}
                                  >
                                    Giao Cho Shipper
                                  </Button>
                                </>
                              )}

                              {status === "SHIPPING" && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={CheckCircle}
                                  onClick={() => handleUpdateOrderStatus(o.id, "DELIVERED")}
                                >
                                  Hoàn Tất Giao Hàng
                                </Button>
                              )}

                              {status === "DELIVERED" && (
                                <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: "700" }}>
                                  ✓ Đơn hàng đã hoàn tất
                                </span>
                              )}

                              {status === "CANCELLED" && (
                                <span style={{ fontSize: "12px", color: "var(--error)", fontWeight: "700" }}>
                                  Đơn đã bị hủy
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 4: COUPONS */}
              {activeTab === "coupons" && (
                <div
                  className="card"
                  style={{
                    padding: "20px",
                    backgroundColor: "var(--surface)",
                    borderRadius: "var(--r-lg)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "16px",
                      paddingBottom: "12px",
                      borderBottom: "1px solid var(--border-light)",
                    }}
                  >
                    <strong style={{ fontSize: "16px" }}>Mã Giảm Giá Của Shop ({coupons.length})</strong>
                    <Button variant="primary" size="sm" icon={Plus} onClick={() => setCouponModalOpen(true)}>
                      Tạo Voucher Mới
                    </Button>
                  </div>

                  {coupons.length === 0 ? (
                    <EmptyState
                      title="Shop chưa tạo voucher khuyến mãi nào"
                      description="Tạo voucher để kích cầu mua sắm và tăng doanh số cho shop!"
                    />
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
                      {coupons.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            border: "1px dashed var(--primary)",
                            backgroundColor: "var(--primary-light)",
                            borderRadius: "var(--r-md)",
                            padding: "16px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong style={{ fontSize: "16px", color: "var(--primary)" }}>{c.code}</strong>
                            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>HSD: {c.expiry}</span>
                          </div>
                          <div style={{ fontSize: "13px", fontWeight: "600", marginTop: "6px" }}>
                            Giảm {formatCurrency(c.discountValue || c.discount)}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                            Đơn tối thiểu: {formatCurrency(c.minOrderValue || c.minOrder || 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: SETTINGS */}
              {activeTab === "settings" && (
                <div
                  className="card"
                  style={{
                    padding: "28px",
                    backgroundColor: "var(--surface)",
                    borderRadius: "var(--r-lg)",
                    border: "1px solid var(--border-light)",
                    maxWidth: "600px",
                  }}
                >
                  <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "16px" }}>Hồ Sơ Cửa Hàng</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                        Tên Gian Hàng
                      </label>
                      <input
                        type="text"
                        defaultValue={shop.name}
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "4px" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                        Số Điện Thoại Shop
                      </label>
                      <input
                        type="tel"
                        defaultValue={shop.phone || user?.phone || ""}
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "4px" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                        Mô Tả Shop
                      </label>
                      <textarea
                        rows={3}
                        defaultValue={shop.description || ""}
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "4px" }}
                      />
                    </div>
                    <Button variant="primary" onClick={() => showToast("Đã lưu cài đặt gian hàng!")}>
                      Lưu Cài Đặt
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal Add/Edit Product */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct ? "Chỉnh Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}
      >
        <form onSubmit={handleSaveProduct} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Tên Sản Phẩm:</label>
            <input
              type="text"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px" }}
              required
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Giá Bán (VNĐ):</label>
              <input
                type="number"
                value={productForm.basePrice}
                onChange={(e) => setProductForm({ ...productForm, basePrice: e.target.value })}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px" }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Số Lượng Kho:</label>
              <input
                type="number"
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px" }}
                required
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>
              Hình Ảnh Sản Phẩm (Tải lên từ máy / điện thoại):
            </label>

            {productForm.imageUrl && (
              <div style={{ position: "relative", width: "80px", height: "80px", marginBottom: "8px", borderRadius: "6px", overflow: "hidden", border: "1.5px solid var(--border)" }}>
                <img
                  src={productForm.imageUrl}
                  alt="Product preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <button
                  type="button"
                  onClick={() => setProductForm({ ...productForm, imageUrl: "" })}
                  style={{
                    position: "absolute",
                    top: "3px",
                    right: "3px",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(0, 0, 0, 0.65)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "900",
                  }}
                  title="Xóa ảnh này"
                >
                  ✕
                </button>
              </div>
            )}

            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                borderRadius: "var(--r-sm)",
                border: "1px dashed var(--primary)",
                backgroundColor: "var(--primary-light)",
                color: "var(--primary)",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <span>+ Chọn ảnh sản phẩm từ thiết bị</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (loadEvt) => {
                      if (loadEvt.target?.result) {
                        setProductForm((prev) => ({ ...prev, imageUrl: loadEvt.target.result }));
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ display: "none" }}
              />
            </label>
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Mô Tả Sản Phẩm:</label>
            <textarea
              rows={3}
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px" }}
            />
          </div>
          <Button variant="primary" type="submit" block style={{ marginTop: "6px" }}>
            {editingProduct ? "Lưu Thay Đổi" : "Đăng Sản Phẩm"}
          </Button>
        </form>
      </Modal>

      {/* Modal Add Coupon */}
      <Modal
        isOpen={couponModalOpen}
        onClose={() => setCouponModalOpen(false)}
        title="Tạo Mã Giảm Giá Shop"
      >
        <form onSubmit={handleSaveCoupon} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Mã Giảm Giá (Code):</label>
            <input
              type="text"
              placeholder="VD: SHOP50K"
              value={couponForm.code}
              onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
              style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px", textTransform: "uppercase" }}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Số Tiền Giảm (VNĐ):</label>
            <input
              type="number"
              placeholder="VD: 50000"
              value={couponForm.discount}
              onChange={(e) => setCouponForm({ ...couponForm, discount: e.target.value })}
              style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px" }}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Đơn Hàng Tối Thiểu (VNĐ):</label>
            <input
              type="number"
              placeholder="VD: 300000"
              value={couponForm.minOrder}
              onChange={(e) => setCouponForm({ ...couponForm, minOrder: e.target.value })}
              style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px" }}
            />
          </div>
          <Button variant="primary" type="submit" block style={{ marginTop: "6px" }}>
            Tạo Voucher
          </Button>
        </form>
      </Modal>

      <Footer />
      <MobileNav />
    </div>
  );
}