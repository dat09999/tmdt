import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import SubNav from "../components/layout/SubNav";
import MobileNav from "../components/layout/MobileNav";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
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
} from "lucide-react";

export default function SellerPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "products" | "orders" | "coupons" | "settings"
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

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

  const shopId = user?.shopId || "shop-apple-official";

  const loadData = async () => {
    try {
      setLoading(true);
      const [sData, pData, oData, cData] = await Promise.all([
        sellerService.getDashboardStats(shopId),
        sellerService.getProducts(shopId),
        sellerService.getOrders(shopId),
        sellerService.getCoupons(shopId),
      ]);
      setStats(sData);
      setProducts(pData || []);
      setOrders(oData || []);
      setCoupons(cData || []);
    } catch (err) {
      console.error("Load seller data failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.basePrice) {
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
      await sellerService.updateProduct(shopId, editingProduct.id, payload);
      showToast("Đã cập nhật sản phẩm thành công!");
    } else {
      await sellerService.createProduct(shopId, payload);
      showToast("Đã thêm sản phẩm mới thành công!");
    }

    setProductModalOpen(false);
    setEditingProduct(null);
    await loadData();
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      await sellerService.deleteProduct(shopId, id);
      showToast("Đã xóa sản phẩm thành công!");
      await loadData();
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    await sellerService.updateOrderStatus(shopId, orderId, newStatus);
    showToast(`Đã chuyển trạng thái đơn hàng sang: ${newStatus}`);
    await loadData();
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discount) {
      showToast("Vui lòng nhập mã và số tiền giảm!");
      return;
    }
    await sellerService.createCoupon(shopId, {
      code: couponForm.code.toUpperCase(),
      discount: Number(couponForm.discount),
      minOrder: Number(couponForm.minOrder) || 0,
      expiry: couponForm.expiry,
    });
    showToast("Đã tạo voucher khuyến mãi thành công!");
    setCouponModalOpen(false);
    await loadData();
  };

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
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary-light)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Store size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text)" }}>
                  Kênh Người Bán - DoMix Seller Center
                </h1>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Quản lý sản phẩm, xử lý đơn hàng và phát triển doanh số shop của bạn
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

          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Stat Metric Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "16px",
                }}
              >
                <div className="card" style={{ padding: "20px", backgroundColor: "#fff" }}>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600" }}>
                    Doanh Thu Tháng Này
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "900", color: "var(--primary)", marginTop: "6px" }}>
                    {formatCurrency(stats?.totalRevenue || 128450000)}
                  </div>
                  <div style={{ fontSize: "11px", color: "#059669", marginTop: "4px" }}>
                    ↑ +18.4% so với tháng trước
                  </div>
                </div>

                <div className="card" style={{ padding: "20px", backgroundColor: "#fff" }}>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600" }}>
                    Tổng Số Đơn Hàng
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "900", color: "var(--text)", marginTop: "6px" }}>
                    {stats?.totalOrders || 320} đơn
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                    14 đơn đang chờ xác nhận
                  </div>
                </div>

                <div className="card" style={{ padding: "20px", backgroundColor: "#fff" }}>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600" }}>
                    Đánh Giá Shop
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "900", color: "#f59e0b", marginTop: "6px" }}>
                    ⭐ {stats?.rating || "4.9"} / 5.0
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                    Tỉ lệ phản hồi chat: {stats?.responseRate || "99%"}
                  </div>
                </div>

                <div className="card" style={{ padding: "20px", backgroundColor: "#fff" }}>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600" }}>
                    Sản Phẩm Đang Bán
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: "900", color: "var(--text)", marginTop: "6px" }}>
                    {products.length} mặt hàng
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--error)", marginTop: "4px" }}>
                    {stats?.outOfStockProducts || 3} mặt hàng sắp hết kho
                  </div>
                </div>
              </div>

              {/* To-Do List Checklist */}
              <div
                className="card"
                style={{
                  padding: "24px",
                  backgroundColor: "var(--surface)",
                  borderRadius: "var(--r-lg)",
                  border: "1px solid var(--border-light)",
                }}
              >
                <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "16px" }}>
                  Danh Sách Việc Cần Làm
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "14px",
                  }}
                >
                  <div
                    onClick={() => setActiveTab("orders")}
                    style={{
                      padding: "16px",
                      backgroundColor: "var(--primary-light)",
                      borderRadius: "8px",
                      border: "1px solid var(--border-primary)",
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                  >
                    <strong style={{ fontSize: "22px", color: "var(--primary)", display: "block" }}>14</strong>
                    <span style={{ fontSize: "12px", color: "var(--text)" }}>Chờ Xác Nhận</span>
                  </div>

                  <div
                    onClick={() => setActiveTab("orders")}
                    style={{
                      padding: "16px",
                      backgroundColor: "var(--surface-muted)",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                  >
                    <strong style={{ fontSize: "22px", color: "var(--info)", display: "block" }}>8</strong>
                    <span style={{ fontSize: "12px", color: "var(--text)" }}>Chờ Lấy Hàng</span>
                  </div>

                  <div
                    onClick={() => (window.location.href = "/refunds")}
                    style={{
                      padding: "16px",
                      backgroundColor: "#fff7ed",
                      borderRadius: "8px",
                      border: "1px solid #fed7aa",
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                  >
                    <strong style={{ fontSize: "22px", color: "#ea580c", display: "block" }}>2</strong>
                    <span style={{ fontSize: "12px", color: "var(--text)" }}>Trả Hàng / Hoàn Tiền</span>
                  </div>

                  <div
                    onClick={() => setActiveTab("products")}
                    style={{
                      padding: "16px",
                      backgroundColor: "#fef2f2",
                      borderRadius: "8px",
                      border: "1px solid #fecaca",
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                  >
                    <strong style={{ fontSize: "22px", color: "var(--error)", display: "block" }}>3</strong>
                    <span style={{ fontSize: "12px", color: "var(--text)" }}>Sản Phẩm Hết Hàng</span>
                  </div>
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
                        <td style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                          <img
                            src={p.images?.[0]?.url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"}
                            alt={p.name}
                            style={{ width: "48px", height: "48px", borderRadius: "6px", objectFit: "cover" }}
                          />
                          <div>
                            <div style={{ fontWeight: "600", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                              ID: {p.id} • {p.categoryName || "Điện tử"}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: "700", color: "var(--primary)" }}>
                          {formatCurrency(p.basePrice)}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {p.variants?.[0]?.stock || 50}
                        </td>
                        <td style={{ padding: "12px 16px" }}>{p.soldCount || 0}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              backgroundColor: "var(--success-bg)",
                              color: "var(--success-dark)",
                              padding: "2px 8px",
                              borderRadius: "99px",
                              fontSize: "11px",
                              fontWeight: "700",
                            }}
                          >
                            Đang bán
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
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
            </div>
          )}

          {/* TAB 3: ORDERS MANAGER */}
          {activeTab === "orders" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {orders.map((o) => (
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
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "14px" }}>Đơn #{o.orderCode || o.id}</strong>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)", marginLeft: "8px" }}>
                        Khách: {o.recipient?.name} ({o.recipient?.phone})
                      </span>
                    </div>

                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "99px",
                        fontSize: "12px",
                        fontWeight: "700",
                        backgroundColor: "var(--primary-light)",
                        color: "var(--primary)",
                      }}
                    >
                      {o.orderStatus}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
                    {(o.items || []).map((it, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span>{it.productName} (x{it.quantity})</span>
                        <strong>{formatCurrency(it.price * it.quantity)}</strong>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "12px",
                      borderTop: "1px solid var(--border-light)",
                    }}
                  >
                    <div style={{ fontSize: "13px" }}>
                      Địa chỉ giao: <span style={{ color: "var(--text-secondary)" }}>{o.recipient?.address}</span>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(o.id, "PROCESSING")}
                      >
                        Xác Nhận Đơn
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(o.id, "SHIPPING")}
                      >
                        Giao Cho Shipper
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
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
                }}
              >
                <strong style={{ fontSize: "16px" }}>Mã Khuyến Mãi Của Shop</strong>
                <Button variant="primary" size="sm" icon={Plus} onClick={() => setCouponModalOpen(true)}>
                  Tạo Voucher Mới
                </Button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "14px",
                }}
              >
                {coupons.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      border: "1px dashed var(--primary)",
                      borderRadius: "8px",
                      padding: "16px",
                      backgroundColor: "var(--primary-light)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "16px", color: "var(--primary)" }}>{c.code}</strong>
                      <span style={{ fontSize: "11px", backgroundColor: "#fff", padding: "2px 6px", borderRadius: "4px" }}>
                        Đã dùng: {c.usageCount || 0}
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "700" }}>
                      Giảm {formatCurrency(c.discount)}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      Đơn tối thiểu: {formatCurrency(c.minOrder)} • HSD: {c.expiry}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === "settings" && (
            <div
              className="card"
              style={{
                padding: "24px",
                backgroundColor: "var(--surface)",
                borderRadius: "var(--r-lg)",
                border: "1px solid var(--border-light)",
                maxWidth: "600px",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "16px" }}>
                Cài Đặt Hồ Sơ Shop
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  showToast("Cập nhật thông tin shop thành công!");
                }}
                style={{ display: "flex", flexDirection: "column", gap: "14px" }}
              >
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Tên Shop:
                  </label>
                  <input
                    type="text"
                    defaultValue="Apple Flagship Store"
                    style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Địa Chỉ Kho Hàng:
                  </label>
                  <input
                    type="text"
                    defaultValue="Kho Tân Bình, TP. Hồ Chí Minh"
                    style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Giờ Làm Việc:
                  </label>
                  <input
                    type="text"
                    defaultValue="08:00 - 22:00 (Tất cả các ngày trong tuần)"
                    style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px" }}
                  />
                </div>
                <Button variant="primary" type="submit" style={{ marginTop: "8px" }}>
                  Lưu Thay Đổi
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Modal Add/Edit Product */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct ? "Chỉnh Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}
      >
        <form onSubmit={handleSaveProduct} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
              Tên Sản Phẩm: <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <input
              type="text"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              placeholder="VD: iPhone 15 Pro Max 256GB"
              style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px" }}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                Giá Bán (₫): <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <input
                type="number"
                value={productForm.basePrice}
                onChange={(e) => setProductForm({ ...productForm, basePrice: e.target.value })}
                placeholder="29990000"
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px" }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                Số Lượng Kho:
              </label>
              <input
                type="number"
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px" }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
              Link Ảnh Sản Phẩm (URL):
            </label>
            <input
              type="text"
              value={productForm.imageUrl}
              onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
              placeholder="https://..."
              style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
              Mô Tả Sản Phẩm:
            </label>
            <textarea
              rows={3}
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px", fontFamily: "inherit" }}
            />
          </div>

          <Button variant="primary" type="submit" block style={{ marginTop: "8px" }}>
            {editingProduct ? "Lưu Cập Nhật" : "Tạo Sản Phẩm"}
          </Button>
        </form>
      </Modal>

      {/* Modal Add Coupon */}
      <Modal
        isOpen={couponModalOpen}
        onClose={() => setCouponModalOpen(false)}
        title="Tạo Mã Giảm Giá Mới"
      >
        <form onSubmit={handleSaveCoupon} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
              Mã Voucher (Code):
            </label>
            <input
              type="text"
              placeholder="VD: SHOP30K"
              value={couponForm.code}
              onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
              style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px", textTransform: "uppercase" }}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
              Mức Giảm (₫):
            </label>
            <input
              type="number"
              placeholder="VD: 30000"
              value={couponForm.discount}
              onChange={(e) => setCouponForm({ ...couponForm, discount: e.target.value })}
              style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px" }}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
              Đơn Hàng Tối Thiểu (₫):
            </label>
            <input
              type="number"
              placeholder="VD: 200000"
              value={couponForm.minOrder}
              onChange={(e) => setCouponForm({ ...couponForm, minOrder: e.target.value })}
              style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px" }}
            />
          </div>
          <Button variant="primary" type="submit" block>
            Tạo Mã Voucher
          </Button>
        </form>
      </Modal>

      <Footer />
      <MobileNav />
    </div>
  );
}