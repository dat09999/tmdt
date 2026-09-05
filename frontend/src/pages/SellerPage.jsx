import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import SubNav from "../components/layout/SubNav";
import MobileNav from "../components/layout/MobileNav";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import EmptyState from "../components/common/EmptyState";
import AddressAutocomplete from "../components/common/AddressAutocomplete";
import SellerChatCenter from "../components/chat/SellerChatCenter";
import { sellerService } from "../services/sellerService";
import { chatService } from "../services/chatService";
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
  Calendar,
  MessageCircle,
  Layers,
  Camera,
} from "lucide-react";

const CATEGORY_OPTIONS = [
  { id: "dien-thoai", name: "Điện thoại & Phụ kiện" },
  { id: "laptop", name: "Laptop & Thiết bị tin học" },
  { id: "thoi-trang-nam", name: "Thời trang nam" },
  { id: "thoi-trang-nu", name: "Thời trang nữ" },
  { id: "giay-dep", name: "Giày dép & Túi xách" },
  { id: "dien-gia-dung", name: "Điện gia dụng" },
  { id: "sac-dep", name: "Sức khỏe & Sắc đẹp" },
  { id: "nha-cua", name: "Nhà cửa & Đời sống" },
  { id: "the-thao", name: "Thể thao & Du lịch" },
  { id: "khac", name: "Danh mục khác" },
];

const getTodayStr = () => new Date().toISOString().split("T")[0];
const getNDaysAgoStr = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  return d.toISOString().split("T")[0];
};

export default function SellerPage() {
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingShop, setCheckingShop] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "products" | "orders" | "coupons" | "chat" | "settings"
  const [unreadShopChatCount, setUnreadShopChatCount] = useState(0);
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL"); // "ALL" | "PENDING" | "PROCESSING" | "SHIPPING" | "DELIVERED" | "CANCELLED"
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);

  // Filter state for Analytics Overview
  const [dateFilterMode, setDateFilterMode] = useState("PRESET"); // "PRESET" | "CUSTOM"
  const [analyticsDays, setAnalyticsDays] = useState(10); // 7, 10, 30
  const [customStartDate, setCustomStartDate] = useState(getNDaysAgoStr(10));
  const [customEndDate, setCustomEndDate] = useState(getTodayStr());
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

  // Shop Settings Form
  const [shopSettingsForm, setShopSettingsForm] = useState({
    shopName: "",
    phone: "",
    email: "",
    description: "",
    logo: "",
    coverImage: "",
    address: "",
  });
  const [savingShopSettings, setSavingShopSettings] = useState(false);

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
    variants: [],
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

  const fetchAnalytics = async (shopId, filterParams = null) => {
    if (!shopId) return;
    try {
      setLoadingAnalytics(true);
      let params = filterParams;
      if (!params) {
        if (dateFilterMode === "CUSTOM" && customStartDate && customEndDate) {
          params = { startDate: customStartDate, endDate: customEndDate };
        } else {
          params = { days: analyticsDays };
        }
      }
      const data = await sellerService.getAnalyticsOverview(shopId, params);
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
          sellerService.getAnalyticsOverview(userShop.id, { days: analyticsDays }),
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

  // Poll unread chat messages for shop
  useEffect(() => {
    if (!shop?.id) return;
    const fetchChatUnread = async () => {
      try {
        const convs = await chatService.getShopConversations(shop.id);
        const count = (convs || []).reduce((sum, c) => sum + (c.unreadCountForShop || 0), 0);
        setUnreadShopChatCount(count);
      } catch {}
    };
    fetchChatUnread();
    const interval = setInterval(fetchChatUnread, 8000);

    // Lắng nghe sự kiện khi một hội thoại được đọc
    const handleChatRead = () => {
      fetchChatUnread();
    };
    window.addEventListener("domix:chat-read", handleChatRead);

    return () => {
      clearInterval(interval);
      window.removeEventListener("domix:chat-read", handleChatRead);
    };
  }, [shop?.id]);

  const handleDaysChange = (days) => {
    setDateFilterMode("PRESET");
    setAnalyticsDays(days);
    if (shop?.id) {
      fetchAnalytics(shop.id, { days });
    }
  };

  const handleCustomRangeApply = (e) => {
    if (e) e.preventDefault();
    if (!customStartDate || !customEndDate) {
      showToast("Vui lòng chọn ngày bắt đầu và ngày kết thúc!");
      return;
    }
    if (new Date(customStartDate) > new Date(customEndDate)) {
      showToast("Ngày bắt đầu không được lớn hơn ngày kết thúc!");
      return;
    }
    setDateFilterMode("CUSTOM");
    if (shop?.id) {
      fetchAnalytics(shop.id, { startDate: customStartDate, endDate: customEndDate });
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

  // Synchronize shop data into shopSettingsForm
  useEffect(() => {
    if (shop) {
      setShopSettingsForm({
        shopName: shop.shopName || shop.name || "",
        phone: shop.phone || user?.phone || "",
        email: shop.email || user?.email || "",
        description: shop.description || "",
        logo: shop.logo || "",
        coverImage: shop.coverImage || shop.banner || "",
        address: typeof shop.address === "string" ? shop.address : shop.address?.detail || "",
      });
    }
  }, [shop, user]);

  // Handle upload shop logo from device
  const handleShopLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Dung lượng logo tối đa là 5 MB!");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setShopSettingsForm((prev) => ({ ...prev, logo: event.target.result }));
      showToast("Đã tải ảnh logo lên thành công!");
    };
    reader.readAsDataURL(file);
  };

  // Handle upload shop banner from device
  const handleShopBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast("Dung lượng ảnh bìa tối đa là 8 MB!");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setShopSettingsForm((prev) => ({ ...prev, coverImage: event.target.result }));
      showToast("Đã tải ảnh bìa gian hàng lên thành công!");
    };
    reader.readAsDataURL(file);
  };

  // Save Shop Settings
  const handleSaveShopSettings = async (e) => {
    if (e) e.preventDefault();
    if (!shop?.id) return;
    if (!shopSettingsForm.shopName?.trim()) {
      showToast("Vui lòng nhập tên gian hàng!");
      return;
    }

    const payload = {
      ownerId: user?.userId || shop.ownerId,
      shopName: shopSettingsForm.shopName.trim(),
      name: shopSettingsForm.shopName.trim(),
      phone: shopSettingsForm.phone?.trim() || "",
      email: shopSettingsForm.email?.trim() || "",
      description: shopSettingsForm.description?.trim() || "",
      logo: shopSettingsForm.logo?.trim() || "",
      coverImage: shopSettingsForm.coverImage?.trim() || "",
      address: shopSettingsForm.address?.trim() || "",
    };

    try {
      setSavingShopSettings(true);
      const updated = await sellerService.updateShop(shop.id, payload);
      setShop((prev) => ({
        ...prev,
        ...updated,
        ...payload,
        name: payload.shopName,
      }));
      showToast("🎉 Đã lưu cài đặt và ảnh gian hàng thành công!");
      await loadShopAndData();
    } catch (err) {
      showToast(err.message || "Không thể lưu cài đặt gian hàng. Vui lòng thử lại!");
    } finally {
      setSavingShopSettings(false);
    }
  };

  // Open Create Product Modal
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      categoryId: "dien-thoai",
      basePrice: "",
      originalPrice: "",
      stock: 50,
      description: "",
      imageUrl: "",
      variants: [],
    });
    setProductModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (p) => {
    setEditingProduct(p);
    const totalStock = p.variants?.reduce((sum, v) => sum + (Number(v.stock) || 0), 0) ?? (p.stock || 50);
    setProductForm({
      name: p.name || "",
      categoryId: p.categoryId || "dien-thoai",
      basePrice: p.basePrice ?? "",
      originalPrice: p.originalPrice || p.basePrice || "",
      stock: totalStock,
      description: p.description || "",
      imageUrl: p.images?.[0]?.url || "",
      variants: (p.variants && p.variants.length > 0)
        ? p.variants.map((v) => ({
            sku: v.sku || "",
            color: v.color || "",
            size: v.size || "",
            price: v.price ?? p.basePrice ?? "",
            discountPrice: v.discountPrice ?? "",
            stock: v.stock !== undefined ? v.stock : 0,
            active: v.active !== false,
          }))
        : [],
    });
    setProductModalOpen(true);
  };

  // Variant Management Handlers
  const handleAddVariant = () => {
    const nextIdx = (productForm.variants?.length || 0) + 1;
    const cleanName = (productForm.name || "SP")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 10);
    const newSku = `${cleanName}-${nextIdx}-${Date.now().toString().slice(-4)}`.toUpperCase();

    setProductForm((prev) => ({
      ...prev,
      variants: [
        ...(prev.variants || []),
        {
          sku: newSku,
          color: "",
          size: "",
          price: prev.basePrice || "",
          discountPrice: "",
          stock: prev.stock || 50,
          active: true,
        },
      ],
    }));
  };

  const handleRemoveVariant = (index) => {
    setProductForm((prev) => ({
      ...prev,
      variants: (prev.variants || []).filter((_, i) => i !== index),
    }));
  };

  const handleVariantChange = (index, field, value) => {
    setProductForm((prev) => {
      const updated = [...(prev.variants || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, variants: updated };
    });
  };

  const handleSyncDefaultsToVariants = () => {
    if (!productForm.variants?.length) return;
    setProductForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v) => ({
        ...v,
        price: v.price || prev.basePrice,
        stock: v.stock !== "" && v.stock !== undefined ? v.stock : prev.stock,
      })),
    }));
    showToast("Đã đồng bộ giá và kho mặc định vào các phân loại!");
  };

  // Handle Save Product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name?.trim() || !productForm.basePrice || !shop?.id) {
      showToast("Vui lòng nhập tên và giá sản phẩm!");
      return;
    }

    const basePriceNum = Number(productForm.basePrice);
    if (isNaN(basePriceNum) || basePriceNum < 0) {
      showToast("Giá bán sản phẩm phải lớn hơn hoặc bằng 0!");
      return;
    }

    // Process and validate variants
    let variantsToSave = [];
    if (productForm.variants && productForm.variants.length > 0) {
      const seenSkus = new Set();
      for (let i = 0; i < productForm.variants.length; i++) {
        const v = productForm.variants[i];
        let sku = (v.sku || "").trim();
        if (!sku) {
          sku = `SKU-${Date.now().toString().slice(-4)}-${i + 1}`;
        }
        while (seenSkus.has(sku)) {
          sku = `${sku}-${i + 1}`;
        }
        seenSkus.add(sku);

        const vPrice = Number(v.price) >= 0 ? Number(v.price) : basePriceNum;
        const vStock = v.stock !== "" && !isNaN(Number(v.stock)) && Number(v.stock) >= 0 ? Number(v.stock) : 0;
        const vDiscount = v.discountPrice && Number(v.discountPrice) >= 0 ? Number(v.discountPrice) : null;

        if (vDiscount !== null && vDiscount > vPrice) {
          showToast(`Giá khuyến mãi của phân loại "${v.color || v.size || sku}" không được lớn hơn giá bán!`);
          return;
        }

        variantsToSave.push({
          sku,
          color: (v.color || "").trim() || "Mặc định",
          size: (v.size || "").trim() || "Tiêu chuẩn",
          price: vPrice,
          discountPrice: vDiscount,
          stock: vStock,
          active: v.active !== false,
        });
      }
    } else {
      const defaultSku = `SKU-${(productForm.name || "sp").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 10)}-${Date.now().toString().slice(-4)}`.toUpperCase();
      variantsToSave = [
        {
          sku: defaultSku,
          color: "Mặc định",
          size: "Tiêu chuẩn",
          price: basePriceNum,
          discountPrice: productForm.originalPrice && Number(productForm.originalPrice) > basePriceNum ? basePriceNum : null,
          stock: Number(productForm.stock) || 50,
          active: true,
        },
      ];
    }

    const payload = {
      name: productForm.name.trim(),
      categoryId: productForm.categoryId || "dien-thoai",
      basePrice: basePriceNum,
      originalPrice: Number(productForm.originalPrice) || basePriceNum,
      description: productForm.description || "",
      images: [
        {
          id: "img-1",
          url: productForm.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
          isMain: true,
        },
      ],
      variants: variantsToSave,
    };

    try {
      if (editingProduct) {
        await sellerService.updateProduct(shop.id, editingProduct.id, payload);
        showToast("Đã cập nhật sản phẩm và phân loại thành công!");
      } else {
        await sellerService.createProduct(shop.id, payload);
        showToast("Đã thêm sản phẩm mới thành công!");
      }

      setProductModalOpen(false);
      setEditingProduct(null);
      await loadShopAndData();
    } catch (err) {
      showToast(err.message || "Có lỗi xảy ra khi lưu sản phẩm!");
    }
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
                  onClick={handleOpenCreateProduct}
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
                  {
                    id: "chat",
                    label: (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <span>💬 Chat Khách Hàng</span>
                        {unreadShopChatCount > 0 && (
                          <span
                            style={{
                              backgroundColor: "var(--primary)",
                              color: "#ffffff",
                              fontSize: "10px",
                              fontWeight: "800",
                              padding: "1px 6px",
                              borderRadius: "10px",
                            }}
                          >
                            {unreadShopChatCount}
                          </span>
                        )}
                      </div>
                    ),
                    icon: MessageCircle,
                  },
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
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
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

                    {/* Time Range Filter Controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      {/* Preset Buttons */}
                      <button
                        onClick={() => handleDaysChange(7)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "var(--r-sm)",
                          border: dateFilterMode === "PRESET" && analyticsDays === 7 ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                          backgroundColor: dateFilterMode === "PRESET" && analyticsDays === 7 ? "var(--primary-light)" : "var(--surface)",
                          color: dateFilterMode === "PRESET" && analyticsDays === 7 ? "var(--primary)" : "var(--text)",
                          fontWeight: dateFilterMode === "PRESET" && analyticsDays === 7 ? "700" : "500",
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        7 Ngày
                      </button>

                      <button
                        onClick={() => handleDaysChange(10)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "var(--r-sm)",
                          border: dateFilterMode === "PRESET" && analyticsDays === 10 ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                          backgroundColor: dateFilterMode === "PRESET" && analyticsDays === 10 ? "var(--primary-light)" : "var(--surface)",
                          color: dateFilterMode === "PRESET" && analyticsDays === 10 ? "var(--primary)" : "var(--text)",
                          fontWeight: dateFilterMode === "PRESET" && analyticsDays === 10 ? "700" : "500",
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        10 Ngày (Khuyên dùng)
                      </button>

                      <button
                        onClick={() => handleDaysChange(30)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "var(--r-sm)",
                          border: dateFilterMode === "PRESET" && analyticsDays === 30 ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                          backgroundColor: dateFilterMode === "PRESET" && analyticsDays === 30 ? "var(--primary-light)" : "var(--surface)",
                          color: dateFilterMode === "PRESET" && analyticsDays === 30 ? "var(--primary)" : "var(--text)",
                          fontWeight: dateFilterMode === "PRESET" && analyticsDays === 30 ? "700" : "500",
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        30 Ngày
                      </button>

                      <button
                        onClick={() => setDateFilterMode(dateFilterMode === "CUSTOM" ? "PRESET" : "CUSTOM")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "6px 12px",
                          borderRadius: "var(--r-sm)",
                          border: dateFilterMode === "CUSTOM" ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                          backgroundColor: dateFilterMode === "CUSTOM" ? "var(--primary-light)" : "var(--surface)",
                          color: dateFilterMode === "CUSTOM" ? "var(--primary)" : "var(--text)",
                          fontWeight: dateFilterMode === "CUSTOM" ? "700" : "500",
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <Calendar size={13} />
                        <span>Tùy Chọn Ngày</span>
                      </button>

                      <button
                        onClick={() => shop?.id && fetchAnalytics(shop.id)}
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

                  {/* Custom Date Range Picker Form (when expanded) */}
                  {dateFilterMode === "CUSTOM" && (
                    <form
                      onSubmit={handleCustomRangeApply}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 18px",
                        backgroundColor: "#fff7ed",
                        borderRadius: "var(--r-md)",
                        border: "1px solid #fed7aa",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", color: "#9a3412" }}>
                        <Calendar size={15} color="#ea580c" />
                        <span>Chọn Khoảng Thời Gian:</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Từ:</span>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid var(--border)",
                            fontSize: "12px",
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Đến:</span>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid var(--border)",
                            fontSize: "12px",
                          }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loadingAnalytics}
                        style={{
                          padding: "5px 14px",
                          borderRadius: "4px",
                          backgroundColor: "var(--primary)",
                          color: "#fff",
                          fontWeight: "700",
                          fontSize: "12px",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        {loadingAnalytics ? "Đang tải..." : "Áp Dụng Lọc"}
                      </button>
                    </form>
                  )}

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
                        <span>{dateFilterMode === "CUSTOM" ? `Từ ${customStartDate} đến ${customEndDate}` : `Trong ${analyticsDays} ngày qua`}</span>
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

                  {/* SECTION 1: FULL-WIDTH LARGE REVENUE & ORDER TREND CHART */}
                  <div
                    className="card"
                    style={{
                      padding: "24px",
                      backgroundColor: "var(--surface)",
                      borderRadius: "var(--r-lg)",
                      border: "1px solid var(--border-light)",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Chart Header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "20px",
                        flexWrap: "wrap",
                        gap: "10px",
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
                          <strong style={{ fontSize: "16px", color: "var(--text)" }}>
                            Biểu Đồ Doanh Thu & Lượng Đơn Theo Ngày
                          </strong>
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                            {dateFilterMode === "CUSTOM"
                              ? `Khoảng thời gian: Từ ${customStartDate} đến ${customEndDate}`
                              : `Dữ liệu ${analyticsDays} ngày gần nhất (tự động lấp đầy ngày 0đ)`}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", color: "var(--text-secondary)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "var(--primary)" }} />
                          <span>Doanh thu (VNĐ)</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#f59e0b" }} />
                          <span>Số đơn hàng</span>
                        </div>
                      </div>
                    </div>

                    {/* Chart Body with Y-Axis & Horizontal Scrollable Bars Area */}
                    {(() => {
                      const chartList = analyticsData?.revenueChart || [];
                      if (chartList.length === 0) {
                        return (
                          <div style={{ padding: "80px 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: "14px" }}>
                            Chưa có dữ liệu giao dịch trong khoảng thời gian này.
                          </div>
                        );
                      }

                      const maxRevenue = Math.max(...chartList.map((d) => d.revenue || 0), 1000000);
                      const totalPeriodRevenue = chartList.reduce((sum, d) => sum + (d.revenue || 0), 0);
                      const totalPeriodOrders = chartList.reduce((sum, d) => sum + (d.orderCount || 0), 0);

                      const formatShort = (val) => {
                        if (!val || val === 0) return "0 đ";
                        if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)}T`;
                        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                        if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                        return `${val}đ`;
                      };

                      const ySteps = [
                        maxRevenue,
                        maxRevenue * 0.75,
                        maxRevenue * 0.5,
                        maxRevenue * 0.25,
                        0,
                      ];

                      const minContentWidth = Math.max(760, chartList.length * 64);

                      return (
                        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                          {/* Main Chart Container with Left Y-Axis */}
                          <div style={{ display: "flex", gap: "12px", width: "100%", height: "290px", position: "relative" }}>
                            {/* Y-Axis Value Labels on Left */}
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                height: "240px",
                                width: "60px",
                                flexShrink: 0,
                                textAlign: "right",
                                paddingRight: "8px",
                                fontSize: "11px",
                                color: "var(--text-tertiary)",
                                fontWeight: "600",
                              }}
                            >
                              {ySteps.map((stepVal, sIdx) => (
                                <span key={sIdx}>{formatShort(stepVal)}</span>
                              ))}
                            </div>

                            {/* Scrollable Bars Area with Horizontal Grid Guidelines */}
                            <div
                              style={{
                                flex: 1,
                                overflowX: "auto",
                                overflowY: "hidden",
                                scrollbarWidth: "thin",
                                position: "relative",
                                paddingBottom: "10px",
                              }}
                            >
                              {/* Inner fixed-width container for bars */}
                              <div
                                style={{
                                  minWidth: `${minContentWidth}px`,
                                  height: "240px",
                                  position: "relative",
                                  borderBottom: "2px solid var(--border)",
                                }}
                              >
                                {/* Horizontal Dashed Grid Guidelines */}
                                {[0, 25, 50, 75, 100].map((pct, gIdx) => (
                                  <div
                                    key={gIdx}
                                    style={{
                                      position: "absolute",
                                      left: 0,
                                      right: 0,
                                      bottom: `${pct}%`,
                                      borderBottom: pct === 0 ? "none" : "1px dashed #e5e7eb",
                                      zIndex: 1,
                                    }}
                                  />
                                ))}

                                {/* Bars Flex Row */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-end",
                                    justifyContent: "space-around",
                                    gap: "12px",
                                    height: "100%",
                                    position: "relative",
                                    zIndex: 2,
                                    padding: "0 10px",
                                  }}
                                >
                                  {chartList.map((item, idx) => {
                                    const rev = item.revenue || 0;
                                    const ordersCount = item.orderCount || 0;
                                    const heightPercent = Math.max(4, Math.round((rev / maxRevenue) * 100));
                                    const isHovered = hoveredBar === idx;

                                    // Format readable date: DD/MM (hoặc DD ThMM)
                                    const parts = (item.date || "").split("-");
                                    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.date;

                                    return (
                                      <div
                                        key={idx}
                                        onMouseEnter={() => setHoveredBar(idx)}
                                        onMouseLeave={() => setHoveredBar(null)}
                                        style={{
                                          flex: 1,
                                          minWidth: "48px",
                                          maxWidth: "68px",
                                          height: "100%",
                                          display: "flex",
                                          flexDirection: "column",
                                          justifyContent: "flex-end",
                                          alignItems: "center",
                                          position: "relative",
                                          cursor: "pointer",
                                        }}
                                      >
                                        {/* Floating Tooltip on hover */}
                                        {isHovered && (
                                          <div
                                            style={{
                                              position: "absolute",
                                              bottom: `calc(${heightPercent}% + 20px)`,
                                              backgroundColor: "#1f2937",
                                              color: "#fff",
                                              padding: "10px 14px",
                                              borderRadius: "8px",
                                              fontSize: "12px",
                                              whiteSpace: "nowrap",
                                              zIndex: 100,
                                              boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                                              pointerEvents: "none",
                                              textAlign: "center",
                                              lineHeight: "1.5",
                                            }}
                                          >
                                            <div style={{ fontWeight: "800", color: "#fca5a5", fontSize: "12.5px" }}>
                                              📅 {item.date}
                                            </div>
                                            <div style={{ marginTop: "3px" }}>
                                              Doanh thu: <strong style={{ color: "#fff" }}>{formatCurrency(rev)}</strong>
                                            </div>
                                            <div>
                                              Đơn hoàn thành: <strong style={{ color: "#fbbf24" }}>{ordersCount} đơn</strong>
                                            </div>
                                          </div>
                                        )}

                                        {/* Value Label above the bar */}
                                        <div
                                          style={{
                                            fontSize: "11px",
                                            fontWeight: isHovered ? "800" : "600",
                                            color: isHovered ? "var(--primary)" : rev > 0 ? "var(--text)" : "var(--text-tertiary)",
                                            marginBottom: "4px",
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          {formatShort(rev)}
                                        </div>

                                        {/* Order dot tag if any orders */}
                                        {ordersCount > 0 && (
                                          <div
                                            style={{
                                              padding: "1px 5px",
                                              borderRadius: "99px",
                                              backgroundColor: "#f59e0b",
                                              color: "#fff",
                                              fontSize: "9.5px",
                                              fontWeight: "800",
                                              marginBottom: "4px",
                                              boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                                            }}
                                            title={`${ordersCount} đơn hàng`}
                                          >
                                            {ordersCount}
                                          </div>
                                        )}

                                        {/* Bar Pillar */}
                                        <div
                                          style={{
                                            width: "100%",
                                            maxWidth: "38px",
                                            height: `${heightPercent}%`,
                                            background: isHovered
                                              ? "linear-gradient(180deg, #ea580c 0%, #ee4d2d 100%)"
                                              : rev > 0
                                              ? "linear-gradient(180deg, #ff784e 0%, #ee4d2d 100%)"
                                              : "rgba(229, 231, 235, 0.8)",
                                            borderRadius: "6px 6px 0 0",
                                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                            transform: isHovered ? "scaleY(1.03)" : "scaleY(1)",
                                            transformOrigin: "bottom",
                                            boxShadow: isHovered ? "0 4px 12px rgba(238, 77, 45, 0.35)" : "none",
                                          }}
                                        />

                                        {/* Date Label Below Bar */}
                                        <div
                                          style={{
                                            position: "absolute",
                                            bottom: "-28px",
                                            fontSize: "11.5px",
                                            fontWeight: isHovered ? "800" : "600",
                                            color: isHovered ? "var(--primary)" : "var(--text-secondary)",
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          {formattedDate}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Chart Summary Footer Bar */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginTop: "20px",
                              paddingTop: "14px",
                              borderTop: "1px solid var(--border-light)",
                              fontSize: "13px",
                              color: "var(--text-secondary)",
                              flexWrap: "wrap",
                              gap: "12px",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                              <div>
                                <span>Tổng doanh thu toàn kỳ: </span>
                                <strong style={{ color: "var(--primary)", fontSize: "15px", fontWeight: "900" }}>
                                  {formatCurrency(totalPeriodRevenue)}
                                </strong>
                              </div>
                              <div>
                                <span>Trung bình mỗi ngày: </span>
                                <strong style={{ color: "var(--text)", fontWeight: "700" }}>
                                  {formatCurrency(Math.round(totalPeriodRevenue / (chartList.length || 1)))}/ngày
                                </strong>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span>Tổng đơn hoàn tất: </span>
                              <strong style={{ color: "#0284c7", fontSize: "14px", fontWeight: "800" }}>
                                {totalPeriodOrders} đơn hàng
                              </strong>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* SECTION 2: INSIGHTS ROW (3 BALANCED COLUMNS) */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {/* CARD 1: Biểu Đồ Phân Bố Trạng Thái Đơn Hàng */}
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

                    {/* CARD 2: Top 5 Sản Phẩm Bán Chạy Nhất */}
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
                      onClick={handleOpenCreateProduct}
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
                              <td style={{ padding: "12px 16px" }}>
                                <div>
                                  <strong>
                                    {p.variants && p.variants.length > 0
                                      ? p.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
                                      : (p.stock || 50)}
                                  </strong>
                                  {p.variants && p.variants.length > 1 && (
                                    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                                      ({p.variants.length} phân loại)
                                    </div>
                                  )}
                                </div>
                              </td>
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
                                    onClick={() => handleOpenEditProduct(p)}
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
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: "24px",
                    maxWidth: "800px",
                    margin: "0 auto",
                  }}
                >
                  {/* Shop Branding Card (Cover & Logo) */}
                  <div
                    className="card"
                    style={{
                      backgroundColor: "var(--surface)",
                      borderRadius: "var(--r-xl)",
                      border: "1px solid var(--border-light)",
                      overflow: "hidden",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-light)" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: "800", color: "var(--text)" }}>
                        🖼️ Hình Ảnh & Nhận Diện Thương Hiệu
                      </h3>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                        Cập nhật Logo và Ảnh bìa (Banner) để gian hàng trông chuyên nghiệp và thu hút khách mua hơn.
                      </p>
                    </div>

                    <div style={{ padding: "24px" }}>
                      {/* Banner / Cover Image Box */}
                      <div style={{ marginBottom: "28px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)" }}>
                            Ảnh Bìa Gian Hàng (Banner)
                          </label>
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                            Khuyến nghị tỉ lệ 16:5 (VD: 1200x380 px, tối đa 8MB)
                          </span>
                        </div>

                        <div
                          style={{
                            position: "relative",
                            width: "100%",
                            height: "200px",
                            borderRadius: "var(--r-lg)",
                            overflow: "hidden",
                            backgroundColor: "var(--surface-hover)",
                            border: "1px solid var(--border)",
                            backgroundImage: `url(${shopSettingsForm.coverImage || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200"})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background: "rgba(0, 0, 0, 0.35)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "12px",
                              opacity: 0.95,
                              transition: "opacity 0.2s ease",
                            }}
                          >
                            <label
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "8px 16px",
                                backgroundColor: "#ffffff",
                                color: "#1e293b",
                                borderRadius: "var(--r-full)",
                                fontSize: "13px",
                                fontWeight: "600",
                                cursor: "pointer",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
                              }}
                            >
                              <Camera size={16} />
                              <span>Chọn ảnh bìa từ máy</span>
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handleShopBannerChange}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Direct URL input for Banner */}
                        <div style={{ marginTop: "10px" }}>
                          <input
                            type="url"
                            placeholder="Hoặc dán URL ảnh bìa trực tiếp: https://..."
                            value={shopSettingsForm.coverImage}
                            onChange={(e) => setShopSettingsForm({ ...shopSettingsForm, coverImage: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--r-md)",
                              fontSize: "13px",
                            }}
                          />
                        </div>
                      </div>

                      {/* Logo / Avatar Box */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)" }}>
                            Logo Đại Diện Gian Hàng
                          </label>
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                            Khuyến nghị hình vuông (VD: 500x500 px, tối đa 5MB)
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                          <div
                            style={{
                              position: "relative",
                              width: "88px",
                              height: "88px",
                              borderRadius: "50%",
                              overflow: "hidden",
                              border: "3px solid var(--primary)",
                              boxShadow: "var(--shadow-md)",
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={shopSettingsForm.logo || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"}
                              alt="Shop Logo"
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>

                          <div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div>
                              <label
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "8px 16px",
                                  backgroundColor: "var(--primary-light)",
                                  color: "var(--primary)",
                                  borderRadius: "var(--r-md)",
                                  fontSize: "13px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                  border: "1px solid var(--primary)",
                                }}
                              >
                                <Camera size={16} />
                                <span>Tải logo từ máy</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: "none" }}
                                  onChange={handleShopLogoChange}
                                />
                              </label>
                            </div>
                            <input
                              type="url"
                              placeholder="Hoặc dán URL logo trực tiếp: https://..."
                              value={shopSettingsForm.logo}
                              onChange={(e) => setShopSettingsForm({ ...shopSettingsForm, logo: e.target.value })}
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid var(--border)",
                                borderRadius: "var(--r-md)",
                                fontSize: "13px",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shop Details Form Card */}
                  <div
                    className="card"
                    style={{
                      padding: "24px",
                      backgroundColor: "var(--surface)",
                      borderRadius: "var(--r-xl)",
                      border: "1px solid var(--border-light)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "16px", color: "var(--text)" }}>
                      📋 Thông Tin Gian Hàng
                    </h3>

                    <form onSubmit={handleSaveShopSettings} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div>
                        <label style={{ fontSize: "13px", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                          Tên Gian Hàng <span style={{ color: "var(--error)" }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={shopSettingsForm.shopName}
                          onChange={(e) => setShopSettingsForm({ ...shopSettingsForm, shopName: e.target.value })}
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
                            value={shopSettingsForm.phone}
                            onChange={(e) => setShopSettingsForm({ ...shopSettingsForm, phone: e.target.value })}
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
                            Email Liên Hệ Shop
                          </label>
                          <input
                            type="email"
                            value={shopSettingsForm.email}
                            onChange={(e) => setShopSettingsForm({ ...shopSettingsForm, email: e.target.value })}
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
                          value={shopSettingsForm.address}
                          onChange={(val) => setShopSettingsForm((prev) => ({ ...prev, address: val }))}
                          onPlaceSelect={(place) => {
                            setShopSettingsForm((prev) => ({
                              ...prev,
                              address: place.formattedAddress || place.detail,
                            }));
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "13px", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                          Mô Tả / Giới Thiệu Gian Hàng
                        </label>
                        <textarea
                          rows={4}
                          value={shopSettingsForm.description}
                          onChange={(e) => setShopSettingsForm({ ...shopSettingsForm, description: e.target.value })}
                          placeholder="Mô tả ngành hàng, dịch vụ, cam kết chất lượng của shop..."
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--r-md)",
                            fontSize: "14px",
                            resize: "vertical",
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                        <Button
                          variant="primary"
                          size="lg"
                          type="submit"
                          loading={savingShopSettings}
                          style={{ minWidth: "180px" }}
                        >
                          Lưu Cài Đặt Gian Hàng
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 6: SELLER CHAT CENTER */}
              {activeTab === "chat" && (
                <SellerChatCenter shop={shop} />
              )}
            </>
          )}
        </div>
      </main>

      {/* Floating Seller Quick Chat Button on other tabs */}
      {shop && activeTab !== "chat" && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
          }}
        >
          <button
            onClick={() => setActiveTab("chat")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "var(--primary)",
              color: "#ffffff",
              border: "none",
              borderRadius: "30px",
              padding: "12px 20px",
              boxShadow: "0 6px 24px rgba(238, 77, 45, 0.4)",
              fontWeight: "700",
              fontSize: "14px",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              position: "relative",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <MessageCircle size={20} />
            <span>Chat Khách Hàng</span>
            {unreadShopChatCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  backgroundColor: "#ffffff",
                  color: "var(--primary)",
                  borderRadius: "10px",
                  padding: "1px 6px",
                  fontSize: "11px",
                  fontWeight: "800",
                  border: "2px solid var(--primary)",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                }}
              >
                {unreadShopChatCount > 99 ? "99+" : unreadShopChatCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Modal Add/Edit Product */}
      {/* Modal Add / Edit Product with Variants */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct ? "Chỉnh Sửa Sản Phẩm & Phân Loại" : "Thêm Sản Phẩm Mới"}
        maxWidth="840px"
      >
        <form onSubmit={handleSaveProduct} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Thông tin cơ bản */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                Tên Sản Phẩm: <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="VD: Áo Thun Unisex Cotton 100%..."
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "6px" }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                Ngành Hàng / Danh Mục:
              </label>
              <select
                value={productForm.categoryId || "dien-thoai"}
                onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "6px", backgroundColor: "var(--surface)" }}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                Giá Bán Cơ Bản (VNĐ): <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <input
                type="number"
                placeholder="VD: 150000"
                value={productForm.basePrice}
                onChange={(e) => setProductForm({ ...productForm, basePrice: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "6px" }}
                required
                min={0}
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                Giá Gốc / Niêm Yết (VNĐ):
              </label>
              <input
                type="number"
                placeholder="VD: 200000"
                value={productForm.originalPrice}
                onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "6px" }}
                min={0}
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                Kho Hàng Mặc Định: <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <input
                type="number"
                placeholder="VD: 50"
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "6px" }}
                required
                min={0}
              />
            </div>
          </div>

          {/* Phân loại & Biến thể */}
          <div
            style={{
              padding: "14px",
              backgroundColor: "var(--surface-muted)",
              borderRadius: "8px",
              border: "1px solid var(--border-light)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Layers size={17} color="var(--primary)" />
                <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)" }}>
                  Phân Loại / Biến Thể Sản Phẩm ({productForm.variants?.length || 0})
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {productForm.variants?.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSyncDefaultsToVariants}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                      backgroundColor: "var(--surface)",
                      color: "var(--text-secondary)",
                      fontSize: "11px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                    title="Sao chép Giá Bán và Kho mặc định vào các phân loại"
                  >
                    ⚡ Đồng bộ giá & kho chung
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddVariant}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--primary)",
                    backgroundColor: "var(--primary-light)",
                    color: "var(--primary)",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Plus size={14} /> Thêm phân loại
                </button>
              </div>
            </div>

            {(!productForm.variants || productForm.variants.length === 0) ? (
              <div
                style={{
                  padding: "12px 14px",
                  backgroundColor: "var(--surface)",
                  borderRadius: "6px",
                  border: "1px dashed var(--border)",
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.5",
                }}
              >
                💡 Hiện tại sản phẩm đang sử dụng <strong>1 phân loại tiêu chuẩn</strong> với Giá bán ({formatCurrency(Number(productForm.basePrice) || 0)}) và Kho hàng ({productForm.stock || 0}).
                Nếu sản phẩm có nhiều phiên bản (như Màu sắc, Kích cỡ, Dung lượng...), hãy bấm <strong>+ Thêm phân loại</strong> để quản lý riêng giá và tồn kho cho từng phiên bản!
              </div>
            ) : (
              <div style={{ overflowX: "auto", backgroundColor: "var(--surface)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "var(--surface-muted)", borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                      <th style={{ padding: "8px 10px", minWidth: "110px" }}>Màu sắc</th>
                      <th style={{ padding: "8px 10px", minWidth: "110px" }}>Size / Bản</th>
                      <th style={{ padding: "8px 10px", minWidth: "120px" }}>Giá bán (VNĐ) *</th>
                      <th style={{ padding: "8px 10px", minWidth: "110px" }}>Giá KM (VNĐ)</th>
                      <th style={{ padding: "8px 10px", minWidth: "90px" }}>Kho *</th>
                      <th style={{ padding: "8px 10px", minWidth: "110px" }}>SKU</th>
                      <th style={{ padding: "8px 10px", textAlign: "center", width: "40px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {productForm.variants.map((v, idx) => (
                      <tr key={idx} style={{ borderBottom: idx < productForm.variants.length - 1 ? "1px solid var(--border-light)" : "none" }}>
                        <td style={{ padding: "6px 8px" }}>
                          <input
                            type="text"
                            placeholder="VD: Đen, Trắng..."
                            value={v.color || ""}
                            onChange={(e) => handleVariantChange(idx, "color", e.target.value)}
                            style={{ width: "100%", padding: "6px 8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "12px" }}
                          />
                        </td>
                        <td style={{ padding: "6px 8px" }}>
                          <input
                            type="text"
                            placeholder="VD: 128GB, L..."
                            value={v.size || ""}
                            onChange={(e) => handleVariantChange(idx, "size", e.target.value)}
                            style={{ width: "100%", padding: "6px 8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "12px" }}
                          />
                        </td>
                        <td style={{ padding: "6px 8px" }}>
                          <input
                            type="number"
                            placeholder={productForm.basePrice || "0"}
                            value={v.price}
                            onChange={(e) => handleVariantChange(idx, "price", e.target.value)}
                            style={{ width: "100%", padding: "6px 8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "12px" }}
                            required
                            min={0}
                          />
                        </td>
                        <td style={{ padding: "6px 8px" }}>
                          <input
                            type="number"
                            placeholder="Tùy chọn"
                            value={v.discountPrice || ""}
                            onChange={(e) => handleVariantChange(idx, "discountPrice", e.target.value)}
                            style={{ width: "100%", padding: "6px 8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "12px" }}
                            min={0}
                          />
                        </td>
                        <td style={{ padding: "6px 8px" }}>
                          <input
                            type="number"
                            placeholder="50"
                            value={v.stock}
                            onChange={(e) => handleVariantChange(idx, "stock", e.target.value)}
                            style={{ width: "100%", padding: "6px 8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "12px" }}
                            required
                            min={0}
                          />
                        </td>
                        <td style={{ padding: "6px 8px" }}>
                          <input
                            type="text"
                            placeholder="Tự sinh..."
                            value={v.sku || ""}
                            onChange={(e) => handleVariantChange(idx, "sku", e.target.value)}
                            style={{ width: "100%", padding: "6px 8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "11px", fontFamily: "monospace" }}
                          />
                        </td>
                        <td style={{ padding: "6px 8px", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            style={{
                              padding: "5px",
                              borderRadius: "4px",
                              border: "none",
                              backgroundColor: "transparent",
                              color: "var(--error)",
                              cursor: "pointer",
                            }}
                            title="Xóa phân loại này"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Hình ảnh */}
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

          {/* Mô tả */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Mô Tả Sản Phẩm:</label>
            <textarea
              rows={3}
              placeholder="Nhập thông tin chi tiết về sản phẩm, đặc điểm nổi bật..."
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "6px" }}
            />
          </div>

          <Button variant="primary" type="submit" block style={{ marginTop: "8px", padding: "10px" }}>
            {editingProduct ? "Lưu Thay Đổi Sản Phẩm & Phân Loại" : "Đăng Sản Phẩm Mới"}
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