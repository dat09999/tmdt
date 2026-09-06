import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingBag,
  RotateCcw,
  Layers,
  Ticket,
  Star,
  Bell,
  CreditCard,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Lock,
  Unlock,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Package,
  Clock,
  Send,
  Eye,
  Plus,
  Edit2,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useAuth } from "./Authcontext";
import { adminService } from "../services/adminService";
import { formatCurrency, formatDate } from "../utils/formatters";
import Pagination from "../components/common/Pagination";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [toast, setToast] = useState(null);

  // Overview stats
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [commissionModal, setCommissionModal] = useState(false);
  const [commissionRateInput, setCommissionRateInput] = useState(5.0);
  const [savingCommission, setSavingCommission] = useState(false);

  // Revenue chart data
  const [revenueData, setRevenueData] = useState([]);
  const [revenueDays, setRevenueDays] = useState(10);
  const [orderDistribution, setOrderDistribution] = useState(null);
  const [topShops, setTopShops] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  // Users Tab
  const [usersData, setUsersData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [userPage, setUserPage] = useState(0);
  const [userKeyword, setUserKeyword] = useState("");
  const [userActiveFilter, setUserActiveFilter] = useState("");
  const [userProviderFilter, setUserProviderFilter] = useState("ALL");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Shops Tab
  const [shopsData, setShopsData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [shopPage, setShopPage] = useState(0);
  const [shopStatusFilter, setShopStatusFilter] = useState("ALL");
  const [shopKeyword, setShopKeyword] = useState("");
  const [loadingShops, setLoadingShops] = useState(false);

  // Orders Tab
  const [ordersData, setOrdersData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [orderPage, setOrderPage] = useState(0);
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Refunds Tab
  const [refundsData, setRefundsData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [refundPage, setRefundPage] = useState(0);
  const [refundStatusFilter, setRefundStatusFilter] = useState("ALL");
  const [loadingRefunds, setLoadingRefunds] = useState(false);
  const [rejectRefundModal, setRejectRefundModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // Categories Tab
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ id: "", name: "", icon: "", description: "" });

  // Coupons Tab
  const [couponsData, setCouponsData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [couponPage, setCouponPage] = useState(0);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  // Reviews Tab
  const [reviewsData, setReviewsData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [reviewPage, setReviewPage] = useState(0);
  const [reviewRatingFilter, setReviewRatingFilter] = useState("");
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Broadcast Tab
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    message: "",
    type: "SYSTEM",
  });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Reconciliation Tab
  const [reconciliation, setReconciliation] = useState(null);
  const [reconStartDate, setReconStartDate] = useState("");
  const [reconEndDate, setReconEndDate] = useState("");
  const [loadingRecon, setLoadingRecon] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ----------------------------------------------------
  // DATA FETCHING
  // ----------------------------------------------------

  const fetchOverview = async () => {
    try {
      setLoadingOverview(true);
      const [ov, rev, dist, ts, tp] = await Promise.all([
        adminService.getOverview().catch(() => null),
        adminService.getRevenueAnalytics({ days: revenueDays }).catch(() => []),
        adminService.getOrderStatusAnalytics().catch(() => null),
        adminService.getTopShops(5).catch(() => []),
        adminService.getTopProducts(5).catch(() => []),
      ]);
      setOverview(ov);
      setRevenueData(rev || []);
      setOrderDistribution(dist);
      setTopShops(ts || []);
      setTopProducts(tp || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await adminService.getUsers({
        active: userActiveFilter,
        provider: userProviderFilter,
        keyword: userKeyword,
        page: userPage,
        size: 10,
      });
      setUsersData(res || { content: [], totalPages: 0, totalElements: 0 });
    } catch (err) {
      showToast(err.message || "Lỗi tải người dùng", "error");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchShops = async () => {
    try {
      setLoadingShops(true);
      const res = await adminService.getShops({
        status: shopStatusFilter,
        keyword: shopKeyword,
        page: shopPage,
        size: 10,
      });
      setShopsData(res || { content: [], totalPages: 0, totalElements: 0 });
    } catch (err) {
      showToast(err.message || "Lỗi tải gian hàng", "error");
    } finally {
      setLoadingShops(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await adminService.getOrders({
        status: orderStatusFilter,
        page: orderPage,
        size: 10,
      });
      setOrdersData(res || { content: [], totalPages: 0, totalElements: 0 });
    } catch (err) {
      showToast(err.message || "Lỗi tải đơn hàng", "error");
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchRefunds = async () => {
    try {
      setLoadingRefunds(true);
      const res = await adminService.getRefunds({
        status: refundStatusFilter,
        page: refundPage,
        size: 10,
      });
      setRefundsData(res || { content: [], totalPages: 0, totalElements: 0 });
    } catch (err) {
      showToast(err.message || "Lỗi tải khiếu nại", "error");
    } finally {
      setLoadingRefunds(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await adminService.getCategories();
      setCategories(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      setLoadingCoupons(true);
      const res = await adminService.getCoupons({ page: couponPage, size: 10 });
      setCouponsData(res || { content: [], totalPages: 0, totalElements: 0 });
    } catch (err) {
      showToast(err.message || "Lỗi tải mã giảm giá", "error");
    } finally {
      setLoadingCoupons(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const res = await adminService.getReviews({
        rating: reviewRatingFilter,
        page: reviewPage,
        size: 10,
      });
      setReviewsData(res || { content: [], totalPages: 0, totalElements: 0 });
    } catch (err) {
      showToast(err.message || "Lỗi tải đánh giá", "error");
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchReconciliation = async () => {
    try {
      setLoadingRecon(true);
      const res = await adminService.getPaymentReconciliation({
        startDate: reconStartDate,
        endDate: reconEndDate,
      });
      setReconciliation(res);
    } catch (err) {
      showToast(err.message || "Lỗi tải đối soát thanh toán", "error");
    } finally {
      setLoadingRecon(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [revenueDays]);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "shops") fetchShops();
    if (activeTab === "orders") fetchOrders();
    if (activeTab === "refunds") fetchRefunds();
    if (activeTab === "categories") fetchCategories();
    if (activeTab === "coupons") fetchCoupons();
    if (activeTab === "reviews") fetchReviews();
    if (activeTab === "reconciliation") fetchReconciliation();
  }, [
    activeTab,
    userPage,
    userActiveFilter,
    userProviderFilter,
    shopPage,
    shopStatusFilter,
    orderPage,
    orderStatusFilter,
    refundPage,
    refundStatusFilter,
    couponPage,
    reviewPage,
    reviewRatingFilter,
  ]);

  // ----------------------------------------------------
  // ACTION HANDLERS
  // ----------------------------------------------------

  const handleToggleUserStatus = async (targetUser) => {
    const nextStatus = !targetUser.active;
    const confirmMsg = nextStatus
      ? `Bạn có chắc muốn MỞ KHÓA tài khoản ${targetUser.email}?`
      : `Bạn có chắc muốn KHÓA tài khoản ${targetUser.email}? Người này sẽ bị thu hồi phiên đăng nhập ngay lập tức.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await adminService.updateUserStatus(targetUser.userId || targetUser.id, nextStatus);
      showToast(`Đã ${nextStatus ? "mở khóa" : "khóa"} tài khoản thành công!`);
      fetchUsers();
    } catch (err) {
      showToast(err.message || "Thao tác thất bại", "error");
    }
  };

  const handleApproveShop = async (shopId) => {
    try {
      await adminService.approveShop(shopId);
      showToast("Đã phê duyệt gian hàng thành công!");
      fetchShops();
      fetchOverview();
    } catch (err) {
      showToast(err.message || "Phê duyệt thất bại", "error");
    }
  };

  const handleSuspendShop = async (shopId) => {
    const reason = window.prompt("Nhập lý do đình chỉ / tạm khóa shop:", "Vi phạm quy chế sàn");
    if (reason === null) return;
    try {
      await adminService.suspendShop(shopId, reason);
      showToast("Đã đình chỉ gian hàng!");
      fetchShops();
      fetchOverview();
    } catch (err) {
      showToast(err.message || "Thao tác thất bại", "error");
    }
  };

  const handleActivateShop = async (shopId) => {
    try {
      await adminService.updateShopStatus(shopId, "ACTIVE");
      showToast("Đã kích hoạt lại gian hàng!");
      fetchShops();
      fetchOverview();
    } catch (err) {
      showToast(err.message || "Thao tác thất bại", "error");
    }
  };

  const handleCancelExpiredOrders = async () => {
    if (!window.confirm("Hệ thống sẽ quét các đơn VNPay quá 15 phút chưa thanh toán và hủy tự động. Tiếp tục?")) return;
    try {
      const res = await adminService.cancelExpiredOrders();
      showToast(res?.message || "Đã quét và hủy các đơn hết hạn!");
      fetchOrders();
      fetchOverview();
    } catch (err) {
      showToast(err.message || "Thao tác thất bại", "error");
    }
  };

  const handleApproveRefund = async (refundId) => {
    if (!window.confirm("Duyệt yêu cầu hoàn tiền? Tồn kho các sản phẩm trong đơn sẽ tự động được hoàn trả.")) return;
    try {
      await adminService.updateRefundStatus(refundId, "APPROVED");
      showToast("Đã duyệt hoàn tiền và phục hồi tồn kho thành công!");
      fetchRefunds();
      fetchOverview();
    } catch (err) {
      showToast(err.message || "Thao tác thất bại", "error");
    }
  };

  const handleConfirmRejectRefund = async () => {
    if (!rejectRefundModal) return;
    try {
      await adminService.updateRefundStatus(rejectRefundModal.id, "REJECTED", rejectReason);
      showToast("Đã từ chối yêu cầu hoàn tiền!");
      setRejectRefundModal(null);
      setRejectReason("");
      fetchRefunds();
      fetchOverview();
    } catch (err) {
      showToast(err.message || "Thao tác thất bại", "error");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Xóa đánh giá này khỏi hệ thống?")) return;
    try {
      await adminService.deleteReview(reviewId);
      showToast("Đã gỡ bỏ đánh giá vi phạm!");
      fetchReviews();
    } catch (err) {
      showToast(err.message || "Thao tác thất bại", "error");
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.message) {
      showToast("Vui lòng nhập tiêu đề và nội dung", "error");
      return;
    }
    if (!window.confirm("Gửi thông báo này đến TOÀN BỘ người dùng trong hệ thống?")) return;
    try {
      setSendingBroadcast(true);
      await adminService.broadcastNotification(broadcastForm);
      showToast("Đã phát thông báo toàn sàn thành công!");
      setBroadcastForm({ title: "", message: "", type: "SYSTEM" });
    } catch (err) {
      showToast(err.message || "Gửi thông báo thất bại", "error");
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name) {
      showToast("Vui lòng nhập tên danh mục", "error");
      return;
    }
    try {
      if (editingCategory) {
        await adminService.updateCategory(editingCategory.id, categoryForm);
        showToast("Đã cập nhật danh mục!");
      } else {
        await adminService.createCategory(categoryForm);
        showToast("Đã thêm danh mục mới!");
      }
      setCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ id: "", name: "", icon: "", description: "" });
      fetchCategories();
    } catch (err) {
      showToast(err.message || "Lưu danh mục thất bại", "error");
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm("Xác nhận xóa danh mục này?")) return;
    try {
      await adminService.deleteCategory(catId);
      showToast("Đã xóa danh mục!");
      fetchCategories();
    } catch (err) {
      showToast(err.message || "Xóa thất bại", "error");
    }
  };

  const handleOpenCommissionModal = () => {
    setCommissionRateInput(overview?.commissionRate ?? 5.0);
    setCommissionModal(true);
  };

  const handleSaveCommissionRate = async (e) => {
    e.preventDefault();
    const rateNum = Number(commissionRateInput);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      showToast("Tỷ lệ hoa hồng phải từ 0% đến 100%", "error");
      return;
    }
    try {
      setSavingCommission(true);
      await adminService.updateCommissionRate(rateNum);
      showToast(`Đã cập nhật mức chiết khấu sàn thành ${rateNum}%!`);
      setCommissionModal(false);
      fetchOverview();
    } catch (err) {
      showToast(err.message || "Cập nhật thất bại", "error");
    } finally {
      setSavingCommission(false);
    }
  };

  // Nav items
  const navItems = [
    { id: "dashboard", label: "Tổng Quan", icon: LayoutDashboard },
    { id: "users", label: "Người Dùng", icon: Users },
    {
      id: "shops",
      label: "Cửa Hàng",
      icon: Store,
      badge: overview?.pendingShops > 0 ? overview.pendingShops : null,
    },
    { id: "orders", label: "Đơn Hàng", icon: ShoppingBag },
    {
      id: "refunds",
      label: "Khiếu Nại",
      icon: RotateCcw,
      badge: overview?.pendingRefunds > 0 ? overview.pendingRefunds : null,
    },
    { id: "categories", label: "Danh Mục", icon: Layers },
    { id: "coupons", label: "Mã Giảm Giá", icon: Ticket },
    { id: "reviews", label: "Đánh Giá", icon: Star },
    { id: "broadcast", label: "Phát Thông Báo", icon: Bell },
    { id: "reconciliation", label: "Đối Soát VNPay", icon: CreditCard },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc", color: "#1e293b", fontFamily: "inherit" }}>
      {/* Toast popup */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            backgroundColor: toast.type === "error" ? "#ef4444" : "#10b981",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            fontSize: "14px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          {toast.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* LEFT SIDEBAR */}
      <aside
        style={{
          width: "260px",
          backgroundColor: "#0f172a",
          color: "#cbd5e1",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          borderRight: "1px solid #1e293b",
        }}
      >
        {/* Brand header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #ee4d2d 0%, #ff7a00 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: "900",
              fontSize: "18px",
            }}
          >
            D
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "800", color: "#ffffff", letterSpacing: "0.5px" }}>DoMix ADMIN</div>
            <div style={{ fontSize: "11px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
              <ShieldCheck size={12} color="#10b981" /> Quản trị sàn thương mại
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: active ? "#ee4d2d" : "transparent",
                  color: active ? "#ffffff" : "#94a3b8",
                  fontWeight: active ? "700" : "500",
                  fontSize: "13.5px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = "#1e293b";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    style={{
                      backgroundColor: active ? "#ffffff" : "#ef4444",
                      color: active ? "#ee4d2d" : "#ffffff",
                      fontSize: "11px",
                      fontWeight: "800",
                      padding: "2px 7px",
                      borderRadius: "10px",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                backgroundColor: "#334155",
                color: "#f8fafc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "13px",
              }}
            >
              {user?.fullName?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div style={{ maxWidth: "120px", overflow: "hidden" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#f8fafc", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.fullName || "Admin"}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Toàn quyền (Root)</div>
            </div>
          </div>
          <a
            href="/"
            title="Quay lại sàn DoMix"
            style={{
              padding: "6px",
              borderRadius: "6px",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowY: "auto" }}>
        {/* Top Navbar */}
        <header
          style={{
            height: "64px",
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px", color: "#64748b" }}>Admin</span>
            <ChevronRight size={14} color="#94a3b8" />
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
              {navItems.find((n) => n.id === activeTab)?.label || "Dashboard"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => {
                fetchOverview();
                if (activeTab === "users") fetchUsers();
                if (activeTab === "shops") fetchShops();
                if (activeTab === "orders") fetchOrders();
                if (activeTab === "refunds") fetchRefunds();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#475569",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={14} /> Làm Mới Dữ Liệu
            </button>

            <a
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "6px",
                backgroundColor: "#f1f5f9",
                color: "#334155",
                fontSize: "13px",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              <Store size={15} /> Về Trang Mua Sắm
            </a>
          </div>
        </header>

        {/* Content Body */}
        <div style={{ padding: "32px" }}>
          {/* ========================================================= */}
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {/* ========================================================= */}
          {activeTab === "dashboard" && (
            <div>
              {/* KPI Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "28px" }}>
                {[
                  {
                    title: "Tổng Giá Trị Giao Dịch (GMV)",
                    value: formatCurrency(overview?.totalRevenue || 0),
                    sub: "Toàn bộ tiền hàng đơn hoàn tất",
                    icon: ShoppingBag,
                    bg: "#eff6ff",
                    color: "#2563eb",
                  },
                  {
                    title: "Doanh Thu Thực Sàn Thu (Net)",
                    value: formatCurrency(overview?.platformNetRevenue || 0),
                    sub: `Chiết khấu hoa hồng ${overview?.commissionRate ?? 5.0}%`,
                    action: {
                      label: "Sửa %",
                      onClick: handleOpenCommissionModal,
                    },
                    icon: CreditCard,
                    bg: "#ecfdf5",
                    color: "#059669",
                  },
                  {
                    title: "Tiền Đối Soát Trả Shop",
                    value: formatCurrency(overview?.sellerPayoutAmount || 0),
                    sub: "Doanh số chi trả về cho các gian hàng",
                    icon: Store,
                    bg: "#f0fdf4",
                    color: "#16a34a",
                  },
                  {
                    title: "Tổng Người Dùng",
                    value: (overview?.totalUsers || 0).toLocaleString(),
                    sub: "Khách mua & Người bán",
                    icon: Users,
                    bg: "#f8fafc",
                    color: "#475569",
                  },
                  {
                    title: "Tổng Gian Hàng",
                    value: (overview?.totalShops || 0).toLocaleString(),
                    sub: overview?.pendingShops > 0 ? `⚠️ ${overview.pendingShops} shop chờ duyệt` : `${overview?.activeShops || 0} shop đang hoạt động`,
                    icon: Store,
                    bg: "#fef3c7",
                    color: "#d97706",
                  },
                  {
                    title: "Khiếu Nại Chờ Xử Lý",
                    value: (overview?.pendingRefunds || 0).toLocaleString(),
                    sub: overview?.pendingRefunds > 0 ? "Cần admin can thiệp giải quyết" : "Không có khiếu nại tồn đọng",
                    icon: RotateCcw,
                    bg: overview?.pendingRefunds > 0 ? "#fee2e2" : "#f1f5f9",
                    color: overview?.pendingRefunds > 0 ? "#dc2626" : "#64748b",
                  },
                ].map((kpi, idx) => {
                  const Icon = kpi.icon;
                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        padding: "20px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>{kpi.title}</span>
                          {kpi.action && (
                            <button
                              onClick={kpi.action.onClick}
                              title="Thay đổi tỷ lệ hoa hồng chiết khấu của sàn"
                              style={{
                                border: "none",
                                background: "#d1fae5",
                                color: "#065f46",
                                fontSize: "11px",
                                fontWeight: "800",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "2px",
                              }}
                            >
                              <Edit2 size={10} /> {kpi.action.label}
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>{kpi.value}</div>
                        {kpi.sub && (
                          <div style={{ fontSize: "11px", fontWeight: "600", color: kpi.color, marginTop: "4px" }}>{kpi.sub}</div>
                        )}
                      </div>
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "10px",
                          backgroundColor: kpi.bg,
                          color: kpi.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={22} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Revenue Chart & Order Status Breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "28px" }}>
                {/* Revenue Bar Chart */}
                <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div>
                      <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>Biểu Đồ Doanh Thu Toàn Sàn</h3>
                      <p style={{ fontSize: "12px", color: "#64748b" }}>Thống kê theo các ngày gần đây</p>
                    </div>
                    <select
                      value={revenueDays}
                      onChange={(e) => setRevenueDays(Number(e.target.value))}
                      style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    >
                      <option value={7}>7 ngày qua</option>
                      <option value={10}>10 ngày qua</option>
                      <option value={30}>30 ngày qua</option>
                    </select>
                  </div>

                  {revenueData.length === 0 ? (
                    <div style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                      Chưa có phát sinh doanh thu trong kỳ
                    </div>
                  ) : (
                    <div style={{ height: "220px", display: "flex", alignItems: "flex-end", gap: "10px", paddingBottom: "24px" }}>
                      {(() => {
                        const maxRev = Math.max(...revenueData.map((d) => d.totalRevenue || 0), 1);
                        return revenueData.map((d, i) => {
                          const heightPct = Math.max(10, Math.round(((d.totalRevenue || 0) / maxRev) * 100));
                          return (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                              <div
                                title={`${d.date}: ${formatCurrency(d.totalRevenue || 0)} (${d.orderCount || 0} đơn)`}
                                style={{
                                  width: "100%",
                                  maxWidth: "36px",
                                  height: `${heightPct}%`,
                                  backgroundColor: "#ee4d2d",
                                  borderRadius: "6px 6px 0 0",
                                  transition: "all 0.2s ease",
                                  cursor: "pointer",
                                }}
                              />
                              <div style={{ fontSize: "10px", color: "#64748b", marginTop: "6px", transform: "rotate(-35deg)", whiteSpace: "nowrap" }}>
                                {d.date?.slice(5)}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>

                {/* Order Distribution */}
                <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>Phân Bố Đơn Hàng</h3>
                  <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px" }}>Trạng thái các đơn hàng hệ thống</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {[
                      { label: "Chờ xác nhận (PENDING)", count: orderDistribution?.pending || 0, color: "#f59e0b" },
                      { label: "Đang xử lý (PROCESSING)", count: orderDistribution?.processing || 0, color: "#3b82f6" },
                      { label: "Đang giao (SHIPPING)", count: orderDistribution?.shipping || 0, color: "#8b5cf6" },
                      { label: "Hoàn tất (COMPLETED)", count: orderDistribution?.completed || 0, color: "#10b981" },
                      { label: "Đã hủy (CANCELED)", count: orderDistribution?.canceled || 0, color: "#ef4444" },
                    ].map((item, idx) => {
                      const total =
                        (orderDistribution?.pending || 0) +
                        (orderDistribution?.processing || 0) +
                        (orderDistribution?.shipping || 0) +
                        (orderDistribution?.completed || 0) +
                        (orderDistribution?.canceled || 0);
                      const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                      return (
                        <div key={idx}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
                            <span style={{ color: "#475569" }}>{item.label}</span>
                            <span style={{ color: "#0f172a" }}>{item.count} ({pct}%)</span>
                          </div>
                          <div style={{ height: "6px", backgroundColor: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, backgroundColor: item.color, borderRadius: "4px" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Top Shops & Top Products */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                {/* Top Shops */}
                <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>🏆 Top 5 Gian Hàng Doanh Thu Khủng</h3>
                  {topShops.length === 0 ? (
                    <div style={{ color: "#94a3b8", fontSize: "13px" }}>Chưa có dữ liệu shop</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {topShops.map((shop, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: i === 0 ? "#fef3c7" : "#f1f5f9", color: i === 0 ? "#d97706" : "#475569", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800" }}>
                              {i + 1}
                            </span>
                            <div>
                              <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a" }}>{shop.shopName || shop.shopId}</div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>{shop.orderCount || 0} đơn hàng thành công</div>
                            </div>
                          </div>
                          <div style={{ fontSize: "14px", fontWeight: "800", color: "#ee4d2d" }}>
                            {formatCurrency(shop.totalRevenue || 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Products */}
                <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>🔥 Top 5 Sản Phẩm Bán Chạy Nhất</h3>
                  {topProducts.length === 0 ? (
                    <div style={{ color: "#94a3b8", fontSize: "13px" }}>Chưa có dữ liệu sản phẩm</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {topProducts.map((prod, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: i === 0 ? "#fee2e2" : "#f1f5f9", color: i === 0 ? "#dc2626" : "#475569", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800" }}>
                              {i + 1}
                            </span>
                            <div>
                              <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0f172a", maxWidth: "220px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {prod.productName || prod.productId}
                              </div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>Đã bán: <strong>{prod.totalQuantitySold || 0}</strong> chiếc</div>
                            </div>
                          </div>
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "#059669" }}>
                            {formatCurrency(prod.totalRevenue || 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: QUẢN LÝ NGƯỜI DÙNG (USERS) */}
          {/* ========================================================= */}
          {activeTab === "users" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Quản Lý Người Dùng Toàn Hệ Thống</h2>

                {/* Filters */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{ position: "relative" }}>
                    <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "10px", top: "10px" }} />
                    <input
                      type="text"
                      placeholder="Tìm email, họ tên..."
                      value={userKeyword}
                      onChange={(e) => setUserKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                      style={{ padding: "8px 12px 8px 32px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", width: "200px" }}
                    />
                  </div>

                  <select
                    value={userActiveFilter}
                    onChange={(e) => setUserActiveFilter(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Đã bị khóa</option>
                  </select>

                  <select
                    value={userProviderFilter}
                    onChange={(e) => setUserProviderFilter(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value="ALL">Tất cả cổng login</option>
                    <option value="LOCAL">Tài khoản Mật khẩu</option>
                    <option value="GOOGLE">Tài khoản Google</option>
                  </select>

                  <button
                    onClick={fetchUsers}
                    style={{ padding: "8px 14px", backgroundColor: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Tìm
                  </button>
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9", textAlign: "left", color: "#64748b" }}>
                      <th style={{ padding: "12px 14px" }}>Người dùng</th>
                      <th style={{ padding: "12px 14px" }}>Email</th>
                      <th style={{ padding: "12px 14px" }}>Số điện thoại</th>
                      <th style={{ padding: "12px 14px" }}>Cổng Auth</th>
                      <th style={{ padding: "12px 14px" }}>Vai trò</th>
                      <th style={{ padding: "12px 14px" }}>Trạng thái</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>Đang tải người dùng...</td>
                      </tr>
                    ) : usersData.content?.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>Không tìm thấy người dùng nào</td>
                      </tr>
                    ) : (
                      usersData.content.map((u) => (
                        <tr key={u.userId || u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 14px", fontWeight: "600", color: "#0f172a" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{ width: "30px", height: "30px", borderRadius: "50%", backgroundColor: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "12px" }}>
                                {u.fullName?.charAt(0)?.toUpperCase() || "U"}
                              </div>
                              <span>{u.fullName || "Chưa đặt tên"}</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px", color: "#475569" }}>{u.email}</td>
                          <td style={{ padding: "12px 14px", color: "#64748b" }}>{u.phone || "—"}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px", backgroundColor: u.provider === "GOOGLE" ? "#fef3c7" : "#f1f5f9", color: u.provider === "GOOGLE" ? "#d97706" : "#475569" }}>
                              {u.provider || "LOCAL"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "800", padding: "2px 8px", borderRadius: "4px", backgroundColor: u.role === "ADMIN" ? "#fee2e2" : "#e0e7ff", color: u.role === "ADMIN" ? "#dc2626" : "#4338ca" }}>
                              {u.role || "USER"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            {u.active !== false ? (
                              <span style={{ fontSize: "12px", color: "#059669", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <CheckCircle size={14} /> Hoạt động
                              </span>
                            ) : (
                              <span style={{ fontSize: "12px", color: "#dc2626", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <XCircle size={14} /> Đã khóa
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right" }}>
                            {u.role !== "ADMIN" && (
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  border: "none",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                  backgroundColor: u.active !== false ? "#fee2e2" : "#ecfdf5",
                                  color: u.active !== false ? "#dc2626" : "#059669",
                                }}
                              >
                                {u.active !== false ? <Lock size={13} /> : <Unlock size={13} />}
                                {u.active !== false ? "Khóa TK" : "Mở Khóa"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={userPage + 1}
                totalPages={usersData.totalPages}
                onPageChange={(p) => setUserPage(p - 1)}
              />
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: QUẢN LÝ CỬA HÀNG (SHOPS) */}
          {/* ========================================================= */}
          {activeTab === "shops" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Quản Lý Gian Hàng Toàn Sàn</h2>
                  <p style={{ fontSize: "12px", color: "#64748b" }}>Duyệt shop mới, tạm khóa hoặc kích hoạt lại gian hàng</p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{ position: "relative" }}>
                    <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "10px", top: "10px" }} />
                    <input
                      type="text"
                      placeholder="Tìm tên shop, email..."
                      value={shopKeyword}
                      onChange={(e) => setShopKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchShops()}
                      style={{ padding: "8px 12px 8px 32px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", width: "200px" }}
                    />
                  </div>

                  <select
                    value={shopStatusFilter}
                    onChange={(e) => setShopStatusFilter(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="PENDING">Chờ phê duyệt</option>
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="SUSPENDED">Đang tạm khóa</option>
                    <option value="BANNED">Đã cấm vĩnh viễn</option>
                    <option value="INACTIVE">Tạm dừng</option>
                  </select>

                  <button
                    onClick={fetchShops}
                    style={{ padding: "8px 14px", backgroundColor: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Lọc
                  </button>
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9", textAlign: "left", color: "#64748b" }}>
                      <th style={{ padding: "12px 14px" }}>Tên gian hàng</th>
                      <th style={{ padding: "12px 14px" }}>Liên hệ</th>
                      <th style={{ padding: "12px 14px" }}>Đánh giá</th>
                      <th style={{ padding: "12px 14px" }}>Đã bán</th>
                      <th style={{ padding: "12px 14px" }}>Trạng thái</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingShops ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>Đang tải danh sách shop...</td>
                      </tr>
                    ) : shopsData.content?.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>Không tìm thấy gian hàng nào</td>
                      </tr>
                    ) : (
                      shopsData.content.map((s) => (
                        <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <img
                                src={s.logo || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"}
                                alt={s.shopName}
                                style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover", border: "1px solid #e2e8f0" }}
                              />
                              <div>
                                <div style={{ fontWeight: "700", color: "#0f172a" }}>{s.shopName}</div>
                                <div style={{ fontSize: "11px", color: "#94a3b8" }}>ID: {s.id}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px", color: "#475569", fontSize: "13px" }}>
                            <div>{s.email || "—"}</div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{s.phone || ""}</div>
                          </td>
                          <td style={{ padding: "12px 14px", fontWeight: "600", color: "#d97706" }}>
                            ⭐ {s.rating || 5.0}/5.0
                          </td>
                          <td style={{ padding: "12px 14px", fontWeight: "600", color: "#0f172a" }}>
                            {(s.totalSales || 0).toLocaleString()} đơn
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "800",
                                padding: "3px 8px",
                                borderRadius: "4px",
                                backgroundColor:
                                  s.status === "ACTIVE"
                                    ? "#ecfdf5"
                                    : s.status === "PENDING"
                                    ? "#fef3c7"
                                    : "#fee2e2",
                                color:
                                  s.status === "ACTIVE"
                                    ? "#059669"
                                    : s.status === "PENDING"
                                    ? "#d97706"
                                    : "#dc2626",
                              }}
                            >
                              {s.status === "ACTIVE"
                                ? "HOẠT ĐỘNG"
                                : s.status === "PENDING"
                                ? "CHỜ DUYỆT"
                                : s.status === "SUSPENDED" || s.status === "BANNED"
                                ? "TẠM KHÓA"
                                : s.status}
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              {s.status === "PENDING" && (
                                <button
                                  onClick={() => handleApproveShop(s.id)}
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    border: "none",
                                    backgroundColor: "#10b981",
                                    color: "#fff",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <CheckCircle size={13} /> Duyệt Shop
                                </button>
                              )}

                              {s.status === "ACTIVE" && (
                                <button
                                  onClick={() => handleSuspendShop(s.id)}
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    border: "none",
                                    backgroundColor: "#fee2e2",
                                    color: "#dc2626",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <Lock size={13} /> Tạm Khóa
                                </button>
                              )}

                              {(s.status === "SUSPENDED" || s.status === "BANNED" || s.status === "INACTIVE") && (
                                <button
                                  onClick={() => handleActivateShop(s.id)}
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    border: "none",
                                    backgroundColor: "#ecfdf5",
                                    color: "#059669",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <Unlock size={13} /> Mở Khóa
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={shopPage + 1}
                totalPages={shopsData.totalPages}
                onPageChange={(p) => setShopPage(p - 1)}
              />
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: QUẢN LÝ ĐƠN HÀNG (ORDERS) */}
          {/* ========================================================= */}
          {activeTab === "orders" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Quản Lý Đơn Hàng Toàn Sàn</h2>
                  <p style={{ fontSize: "12px", color: "#64748b" }}>Theo dõi các đơn hàng, trạng thái thanh toán và quét đơn hết hạn</p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="PENDING">Chờ xác nhận</option>
                    <option value="PROCESSING">Đang xử lý</option>
                    <option value="SHIPPING">Đang giao</option>
                    <option value="COMPLETED">Đã giao thành công</option>
                    <option value="CANCELED">Đã hủy</option>
                    <option value="RETURNED">Đã hoàn trả</option>
                  </select>

                  <button
                    onClick={handleCancelExpiredOrders}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      borderRadius: "6px",
                      border: "1px solid #fee2e2",
                      backgroundColor: "#fff5f5",
                      color: "#dc2626",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    <Clock size={15} /> Quét Đơn Quá Hạn (VNPay)
                  </button>
                </div>
              </div>

              {/* Orders Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9", textAlign: "left", color: "#64748b" }}>
                      <th style={{ padding: "12px 14px" }}>Mã đơn hàng</th>
                      <th style={{ padding: "12px 14px" }}>Ngày tạo</th>
                      <th style={{ padding: "12px 14px" }}>Cửa hàng (Shop ID)</th>
                      <th style={{ padding: "12px 14px" }}>Thanh toán</th>
                      <th style={{ padding: "12px 14px" }}>Trạng thái đơn</th>
                      <th style={{ padding: "12px 14px" }}>Tổng tiền</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>Xem chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingOrders ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>Đang tải danh sách đơn hàng...</td>
                      </tr>
                    ) : ordersData.content?.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>Không tìm thấy đơn hàng nào</td>
                      </tr>
                    ) : (
                      ordersData.content.map((o) => (
                        <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 14px", fontWeight: "700", color: "#0f172a" }}>
                            #{o.id?.slice(-8)?.toUpperCase()}
                          </td>
                          <td style={{ padding: "12px 14px", color: "#64748b", fontSize: "12.5px" }}>
                            {formatDate(o.createdAt)}
                          </td>
                          <td style={{ padding: "12px 14px", color: "#475569" }}>
                            {o.shopId?.slice(-6) || "—"}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a" }}>{o.paymentMethod}</div>
                            <div style={{ fontSize: "11px", fontWeight: "700", color: o.paymentStatus === "PAID" ? "#059669" : "#dc2626" }}>
                              {o.paymentStatus === "PAID" ? "● Đã thanh toán" : "○ Chưa thanh toán"}
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span
                              style={{
                                fontSize: "11.5px",
                                fontWeight: "800",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                backgroundColor:
                                  o.orderStatus === "COMPLETED"
                                    ? "#ecfdf5"
                                    : o.orderStatus === "CANCELED"
                                    ? "#fee2e2"
                                    : "#eff6ff",
                                color:
                                  o.orderStatus === "COMPLETED"
                                    ? "#059669"
                                    : o.orderStatus === "CANCELED"
                                    ? "#dc2626"
                                    : "#2563eb",
                              }}
                            >
                              {o.orderStatus}
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px", fontWeight: "800", color: "#ee4d2d" }}>
                            {formatCurrency(o.totalAmount || 0)}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right" }}>
                            <button
                              onClick={() => setSelectedOrder(o)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                backgroundColor: "#ffffff",
                                color: "#334155",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Eye size={13} /> Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={orderPage + 1}
                totalPages={ordersData.totalPages}
                onPageChange={(p) => setOrderPage(p - 1)}
              />
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: QUẢN LÝ KHIẾU NẠI & HOÀN TIỀN (REFUNDS) */}
          {/* ========================================================= */}
          {activeTab === "refunds" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Yêu Cầu Khiếu Nại & Hoàn Tiền</h2>
                  <p style={{ fontSize: "12px", color: "#64748b" }}>Admin có quyền tối cao giải quyết tranh chấp giữa người mua và shop</p>
                </div>

                <select
                  value={refundStatusFilter}
                  onChange={(e) => setRefundStatusFilter(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING">Đang chờ giải quyết</option>
                  <option value="APPROVED">Đã chấp thuận hoàn tiền</option>
                  <option value="REJECTED">Đã từ chối</option>
                </select>
              </div>

              {/* Refunds Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9", textAlign: "left", color: "#64748b" }}>
                      <th style={{ padding: "12px 14px" }}>Mã hoàn tiền</th>
                      <th style={{ padding: "12px 14px" }}>Đơn hàng</th>
                      <th style={{ padding: "12px 14px" }}>Lý do khiếu nại</th>
                      <th style={{ padding: "12px 14px" }}>Số tiền</th>
                      <th style={{ padding: "12px 14px" }}>Trạng thái</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>Quyết định</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRefunds ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>Đang tải danh sách khiếu nại...</td>
                      </tr>
                    ) : refundsData.content?.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>Không có khiếu nại nào</td>
                      </tr>
                    ) : (
                      refundsData.content.map((r) => (
                        <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 14px", fontWeight: "700", color: "#0f172a" }}>
                            #{r.id?.slice(-8)?.toUpperCase()}
                          </td>
                          <td style={{ padding: "12px 14px", color: "#475569" }}>
                            #{r.orderId?.slice(-8)?.toUpperCase()}
                          </td>
                          <td style={{ padding: "12px 14px", maxWidth: "260px" }}>
                            <div style={{ fontWeight: "600", color: "#0f172a" }}>{r.reason}</div>
                            {r.rejectReason && <div style={{ fontSize: "11px", color: "#dc2626", marginTop: "2px" }}>Lý do từ chối: {r.rejectReason}</div>}
                          </td>
                          <td style={{ padding: "12px 14px", fontWeight: "800", color: "#ee4d2d" }}>
                            {formatCurrency(r.amount || 0)}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span
                              style={{
                                fontSize: "11.5px",
                                fontWeight: "800",
                                padding: "3px 8px",
                                borderRadius: "4px",
                                backgroundColor:
                                  r.status === "APPROVED"
                                    ? "#ecfdf5"
                                    : r.status === "REJECTED"
                                    ? "#fee2e2"
                                    : "#fef3c7",
                                color:
                                  r.status === "APPROVED"
                                    ? "#059669"
                                    : r.status === "REJECTED"
                                    ? "#dc2626"
                                    : "#d97706",
                              }}
                            >
                              {r.status === "APPROVED"
                                ? "ĐÃ DUYỆT HOÀN TIỀN"
                                : r.status === "REJECTED"
                                ? "TỪ CHỐI"
                                : "CHỜ GIẢI QUYẾT"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right" }}>
                            {r.status === "PENDING" && (
                              <div style={{ display: "inline-flex", gap: "6px" }}>
                                <button
                                  onClick={() => handleApproveRefund(r.id)}
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    border: "none",
                                    backgroundColor: "#10b981",
                                    color: "#fff",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                  }}
                                >
                                  Chấp Thuận
                                </button>
                                <button
                                  onClick={() => setRejectRefundModal(r)}
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    border: "none",
                                    backgroundColor: "#fee2e2",
                                    color: "#dc2626",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                  }}
                                >
                                  Từ Chối
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={refundPage + 1}
                totalPages={refundsData.totalPages}
                onPageChange={(p) => setRefundPage(p - 1)}
              />
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: QUẢN LÝ DANH MỤC (CATEGORIES) */}
          {/* ========================================================= */}
          {activeTab === "categories" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Quản Lý Danh Mục Sản Phẩm</h2>
                  <p style={{ fontSize: "12px", color: "#64748b" }}>Thêm, sửa hoặc xóa các danh mục ngành hàng trên trang chủ</p>
                </div>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryForm({ id: "", name: "", icon: "", description: "" });
                    setCategoryModal(true);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#ee4d2d",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  <Plus size={16} /> Thêm Danh Mục Mới
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
                {categories.map((cat) => (
                  <div
                    key={cat.id || cat._id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "28px", marginBottom: "8px" }}>{cat.icon || "📦"}</div>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>{cat.name}</div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                        Mã: <code>{cat.id || cat._id}</code>
                      </div>
                      {cat.description && (
                        <div style={{ fontSize: "12px", color: "#475569", marginTop: "6px" }}>{cat.description}</div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginTop: "16px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setCategoryForm({
                            id: cat.id || cat._id,
                            name: cat.name || "",
                            icon: cat.icon || "",
                            description: cat.description || "",
                          });
                          setCategoryModal(true);
                        }}
                        style={{
                          flex: 1,
                          padding: "6px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          backgroundColor: "#ffffff",
                          color: "#334155",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                        }}
                      >
                        <Edit2 size={13} /> Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id || cat._id)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "none",
                          backgroundColor: "#fee2e2",
                          color: "#dc2626",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: MÃ GIẢM GIÁ (COUPONS) */}
          {/* ========================================================= */}
          {activeTab === "coupons" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Quản Lý Voucher & Mã Giảm Giá</h2>
                  <p style={{ fontSize: "12px", color: "#64748b" }}>Toàn bộ mã voucher do sàn hoặc các chủ shop phát hành</p>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9", textAlign: "left", color: "#64748b" }}>
                      <th style={{ padding: "12px 14px" }}>Mã Voucher</th>
                      <th style={{ padding: "12px 14px" }}>Shop ID</th>
                      <th style={{ padding: "12px 14px" }}>Giảm giá</th>
                      <th style={{ padding: "12px 14px" }}>Đơn tối thiểu</th>
                      <th style={{ padding: "12px 14px" }}>Lượt dùng</th>
                      <th style={{ padding: "12px 14px" }}>Hạn sử dụng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingCoupons ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>Đang tải danh sách voucher...</td>
                      </tr>
                    ) : couponsData.content?.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>Chưa có mã giảm giá nào</td>
                      </tr>
                    ) : (
                      couponsData.content.map((c) => (
                        <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ fontFamily: "monospace", fontSize: "13.5px", fontWeight: "800", color: "#ee4d2d", backgroundColor: "#fff5f5", padding: "4px 8px", borderRadius: "4px", border: "1px dashed #fca5a5" }}>
                              {c.code}
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px", color: "#475569" }}>
                            {c.shopId || "Toàn Sàn (DoMix)"}
                          </td>
                          <td style={{ padding: "12px 14px", fontWeight: "700", color: "#059669" }}>
                            {c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : formatCurrency(c.discountValue || 0)}
                          </td>
                          <td style={{ padding: "12px 14px", color: "#64748b" }}>
                            {formatCurrency(c.minOrderValue || 0)}
                          </td>
                          <td style={{ padding: "12px 14px", fontWeight: "600", color: "#0f172a" }}>
                            {c.usedCount || 0} / {c.usageLimit || "∞"}
                          </td>
                          <td style={{ padding: "12px 14px", color: "#64748b", fontSize: "12.5px" }}>
                            {formatDate(c.expiryDate || c.endDate)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={couponPage + 1}
                totalPages={couponsData.totalPages}
                onPageChange={(p) => setCouponPage(p - 1)}
              />
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 8: KIỂM DUYỆT ĐÁNH GIÁ (REVIEWS) */}
          {/* ========================================================= */}
          {activeTab === "reviews" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Kiểm Duyệt Đánh Giá Toàn Sàn</h2>
                  <p style={{ fontSize: "12px", color: "#64748b" }}>Rà soát và xóa các đánh giá có nội dung xấu, vi phạm hoặc spam</p>
                </div>

                <select
                  value={reviewRatingFilter}
                  onChange={(e) => setReviewRatingFilter(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                >
                  <option value="">Tất cả số sao</option>
                  <option value="1">1 Sao ⭐</option>
                  <option value="2">2 Sao ⭐⭐</option>
                  <option value="3">3 Sao ⭐⭐⭐</option>
                  <option value="4">4 Sao ⭐⭐⭐⭐</option>
                  <option value="5">5 Sao ⭐⭐⭐⭐⭐</option>
                </select>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9", textAlign: "left", color: "#64748b" }}>
                      <th style={{ padding: "12px 14px" }}>Sản phẩm ID</th>
                      <th style={{ padding: "12px 14px" }}>Người đánh giá</th>
                      <th style={{ padding: "12px 14px" }}>Điểm số</th>
                      <th style={{ padding: "12px 14px" }}>Nội dung bình luận</th>
                      <th style={{ padding: "12px 14px" }}>Ngày đánh giá</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>Gỡ bỏ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingReviews ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>Đang tải danh sách đánh giá...</td>
                      </tr>
                    ) : reviewsData.content?.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>Không tìm thấy đánh giá nào</td>
                      </tr>
                    ) : (
                      reviewsData.content.map((rv) => (
                        <tr key={rv.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 14px", color: "#475569", fontWeight: "600" }}>
                            #{rv.productId?.slice(-6)}
                          </td>
                          <td style={{ padding: "12px 14px", fontWeight: "600", color: "#0f172a" }}>
                            {rv.userName || rv.userId?.slice(-6)}
                          </td>
                          <td style={{ padding: "12px 14px", color: "#d97706", fontWeight: "700" }}>
                            {"⭐".repeat(rv.rating || 5)} ({rv.rating}/5)
                          </td>
                          <td style={{ padding: "12px 14px", maxWidth: "300px", color: "#334155" }}>
                            {rv.comment || "(Không có lời bình)"}
                          </td>
                          <td style={{ padding: "12px 14px", color: "#64748b", fontSize: "12px" }}>
                            {formatDate(rv.createdAt)}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right" }}>
                            <button
                              onClick={() => handleDeleteReview(rv.id)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "6px",
                                border: "none",
                                backgroundColor: "#fee2e2",
                                color: "#dc2626",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <Trash2 size={13} /> Xóa
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={reviewPage + 1}
                totalPages={reviewsData.totalPages}
                onPageChange={(p) => setReviewPage(p - 1)}
              />
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 9: PHÁT THÔNG BÁO TOÀN SÀN (BROADCAST) */}
          {/* ========================================================= */}
          {activeTab === "broadcast" && (
            <div style={{ maxWidth: "680px", margin: "0 auto", backgroundColor: "#ffffff", borderRadius: "12px", padding: "32px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <Bell size={24} color="#ee4d2d" />
                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>Phát Thông Báo Toàn Hệ Thống</h2>
              </div>
              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "24px" }}>
                Gửi thông báo đẩy đến tất cả người dùng trong hệ thống (cả người mua và người bán).
              </p>

              <form onSubmit={handleSendBroadcast}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Loại thông báo
                  </label>
                  <select
                    value={broadcastForm.type}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, type: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  >
                    <option value="SYSTEM">Hệ thống & Cập nhật quan trọng (SYSTEM)</option>
                    <option value="PROMOTION">Khuyến mãi & Ưu đãi lớn (PROMOTION)</option>
                    <option value="ALERT">Cảnh báo bảo trì & An ninh (ALERT)</option>
                  </select>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Tiêu đề thông báo
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Đại Tiệc Siêu Sale 11/11 Bắt Đầu Ngay Hôm Nay!"
                    value={broadcastForm.title}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Nội dung chi tiết
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Nhập nội dung thông báo gửi đến toàn thể người dùng..."
                    value={broadcastForm.message}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                    required
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingBroadcast}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#ee4d2d",
                    color: "#ffffff",
                    fontSize: "15px",
                    fontWeight: "800",
                    cursor: sendingBroadcast ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <Send size={18} /> {sendingBroadcast ? "Đang phát thông báo..." : "Gửi Thông Báo Toàn Sàn"}
                </button>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 10: ĐỐI SOÁT THANH TOÁN (RECONCILIATION) */}
          {/* ========================================================= */}
          {activeTab === "reconciliation" && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Đối Soát Thanh Toán VNPay</h2>
                  <p style={{ fontSize: "12px", color: "#64748b" }}>Kiểm tra khớp lệnh giao dịch cổng thanh toán VNPay và tổng tiền đơn hàng</p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="date"
                    value={reconStartDate}
                    onChange={(e) => setReconStartDate(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                  <span>đến</span>
                  <input
                    type="date"
                    value={reconEndDate}
                    onChange={(e) => setReconEndDate(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                  <button
                    onClick={fetchReconciliation}
                    style={{ padding: "8px 14px", backgroundColor: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Đối Soát
                  </button>
                </div>
              </div>

              {loadingRecon ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>Đang tính toán đối soát...</div>
              ) : reconciliation ? (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                    <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>Tổng Đơn Hàng Hoàn Tất</div>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
                        {formatCurrency(reconciliation.totalOrderAmount || 0)}
                      </div>
                    </div>
                    <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                      <div style={{ fontSize: "12px", color: "#065f46" }}>Tổng Thu Cổng VNPay</div>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: "#059669", marginTop: "4px" }}>
                        {formatCurrency(reconciliation.totalVnpayAmount || 0)}
                      </div>
                    </div>
                    <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: reconciliation.difference === 0 ? "#f0fdf4" : "#fef2f2", border: `1px solid ${reconciliation.difference === 0 ? "#bbf7d0" : "#fecaca"}` }}>
                      <div style={{ fontSize: "12px", color: reconciliation.difference === 0 ? "#166534" : "#991b1b" }}>Chênh Lệch Lệnh</div>
                      <div style={{ fontSize: "20px", fontWeight: "800", color: reconciliation.difference === 0 ? "#16a34a" : "#dc2626", marginTop: "4px" }}>
                        {formatCurrency(reconciliation.difference || 0)}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: "14px 18px", borderRadius: "8px", backgroundColor: reconciliation.isMatched ? "#ecfdf5" : "#fef3c7", color: reconciliation.isMatched ? "#065f46" : "#92400e", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                    {reconciliation.isMatched ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    <span>{reconciliation.isMatched ? "Hệ thống khớp lệnh hoàn hảo, không có chênh lệch dòng tiền." : "Cảnh báo: Có sai lệch giữa tiền vào tài khoản VNPay và đơn hàng đã thanh toán."}</span>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>Nhấn "Đối Soát" để kiểm tra số liệu</div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* MODAL: CHI TIẾT ĐƠN HÀNG */}
      {selectedOrder && (
        <Modal isOpen={Boolean(selectedOrder)} onClose={() => setSelectedOrder(null)} title={`Chi Tiết Đơn Hàng #${selectedOrder.id}`}>
          <div style={{ padding: "8px 0" }}>
            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Ngày đặt: {formatDate(selectedOrder.createdAt)}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Shop ID: {selectedOrder.shopId}</div>
              </div>
              <span style={{ fontSize: "12px", fontWeight: "800", padding: "4px 10px", borderRadius: "4px", backgroundColor: "#eff6ff", color: "#2563eb" }}>
                {selectedOrder.orderStatus}
              </span>
            </div>

            <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>Địa chỉ giao hàng:</div>
              <div style={{ fontSize: "13px", color: "#334155" }}>
                {selectedOrder.shippingAddress?.fullName} ({selectedOrder.shippingAddress?.phone})
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                {[selectedOrder.shippingAddress?.detail, selectedOrder.shippingAddress?.ward, selectedOrder.shippingAddress?.district, selectedOrder.shippingAddress?.province].filter(Boolean).join(", ")}
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>Danh sách sản phẩm:</div>
              {(selectedOrder.items || []).map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: "13px" }}>
                  <div>
                    <div style={{ fontWeight: "600", color: "#0f172a" }}>{item.productName || item.productId}</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>SL: x{item.quantity} | Đơn giá: {formatCurrency(item.price || 0)}</div>
                  </div>
                  <div style={{ fontWeight: "700", color: "#0f172a" }}>
                    {formatCurrency((item.price || 0) * (item.quantity || 1))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "2px solid #e2e8f0" }}>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Tổng thanh toán:</span>
              <span style={{ fontSize: "18px", fontWeight: "900", color: "#ee4d2d" }}>
                {formatCurrency(selectedOrder.totalAmount || 0)}
              </span>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: TỪ CHỐI KHIẾU NẠI */}
      {rejectRefundModal && (
        <Modal isOpen={Boolean(rejectRefundModal)} onClose={() => setRejectRefundModal(null)} title="Từ Chối Yêu Cầu Hoàn Tiền">
          <div style={{ padding: "8px 0" }}>
            <p style={{ fontSize: "13px", color: "#475569", marginBottom: "14px" }}>
              Vui lòng nêu rõ lý do từ chối yêu cầu khiếu nại của khách hàng #{rejectRefundModal.id?.slice(-6)}:
            </p>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ví dụ: Sản phẩm đã quá hạn khiếu nại hoặc bằng chứng của người mua không đủ căn cứ..."
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13.5px", marginBottom: "16px" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                onClick={() => setRejectRefundModal(null)}
                style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer" }}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmRejectRefund}
                style={{ padding: "8px 16px", borderRadius: "6px", border: "none", backgroundColor: "#dc2626", color: "#fff", fontWeight: "700", cursor: "pointer" }}
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: THÊM / SỬA DANH MỤC */}
      {categoryModal && (
        <Modal isOpen={categoryModal} onClose={() => setCategoryModal(false)} title={editingCategory ? "Chỉnh Sửa Danh Mục" : "Thêm Danh Mục Mới"}>
          <form onSubmit={handleSaveCategory}>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>Mã định danh (Slug ID)</label>
              <input
                type="text"
                disabled={Boolean(editingCategory)}
                placeholder="dien-thoai, laptop, gia-dung..."
                value={categoryForm.id}
                onChange={(e) => setCategoryForm({ ...categoryForm, id: e.target.value })}
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13.5px" }}
              />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>Tên danh mục</label>
              <input
                type="text"
                placeholder="Điện Thoại & Phụ Kiện"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13.5px" }}
              />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>Icon Emoji</label>
              <input
                type="text"
                placeholder="📱 hoặc 💻 hoặc 👕"
                value={categoryForm.icon}
                onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13.5px" }}
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>Mô tả ngắn</label>
              <textarea
                rows={3}
                placeholder="Mô tả ngành hàng..."
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13.5px" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setCategoryModal(false)}
                style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer" }}
              >
                Hủy
              </button>
              <button
                type="submit"
                style={{ padding: "8px 16px", borderRadius: "6px", border: "none", backgroundColor: "#ee4d2d", color: "#fff", fontWeight: "700", cursor: "pointer" }}
              >
                Lưu Danh Mục
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: CÀI ĐẶT PHÍ HOA HỒNG SÀN */}
      {commissionModal && (
        <Modal isOpen={commissionModal} onClose={() => setCommissionModal(false)} title="Cài Đặt Tỷ Lệ Chiết Khấu Sàn (Hoa Hồng)">
          <form onSubmit={handleSaveCommissionRate}>
            <p style={{ fontSize: "13.5px", color: "#475569", marginBottom: "16px", lineHeight: "1.6" }}>
              Tỷ lệ chiết khấu (hoa hồng) được tính trên mỗi đơn hàng hoàn tất. Số tiền này là doanh thu thực tế sàn giữ lại trước khi chi trả doanh số cho các chủ shop.
            </p>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px", color: "#0f172a" }}>
                Tỷ lệ chiết khấu (%)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={commissionRateInput}
                  onChange={(e) => setCommissionRateInput(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px 36px 10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "15px", fontWeight: "700" }}
                />
                <span style={{ position: "absolute", right: "14px", top: "10px", fontWeight: "800", color: "#64748b" }}>%</span>
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>
                Ví dụ: Đơn hàng 1.000.000 ₫ với tỷ lệ 5.0% thì Sàn thu 50.000 ₫, Shop nhận 950.000 ₫.
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setCommissionModal(false)}
                style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer" }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={savingCommission}
                style={{ padding: "8px 16px", borderRadius: "6px", border: "none", backgroundColor: "#ee4d2d", color: "#fff", fontWeight: "700", cursor: "pointer" }}
              >
                {savingCommission ? "Đang lưu..." : "Lưu Cài Đặt"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
