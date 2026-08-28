import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import SubNav from "../components/layout/SubNav";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import OrderCard from "../components/order/OrderCard";
import Skeleton from "../components/common/Skeleton";
import EmptyState from "../components/common/EmptyState";
import { orderService } from "../services/orderService";
import { useAuth } from "./Authcontext";
import { Package, Search } from "lucide-react";

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const tabs = [
    { id: "ALL", label: "Tất cả" },
    { id: "PENDING", label: "Chờ xác nhận" },
    { id: "PROCESSING", label: "Đang chuẩn bị hàng" },
    { id: "SHIPPING", label: "Đang giao" },
    { id: "DELIVERED", label: "Đã giao" },
    { id: "CANCELLED", label: "Đã hủy" },
  ];

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getBuyerOrders(user?.userId);
      setOrders(data || []);
    } catch (err) {
      console.error("Fetch orders failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user?.userId]);

  const handleCancelOrder = async (orderId) => {
    if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
      await orderService.cancelOrder(orderId, "Khách hàng hủy");
      await fetchOrders();
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesTab =
      activeTab === "ALL" || (o.orderStatus || "").toUpperCase() === activeTab;
    const matchesSearch =
      !searchTerm.trim() ||
      (o.orderCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.items || []).some((item) =>
        (item.productName || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesTab && matchesSearch;
  });

  return (
    <div className="page-shell">
      <Header />
      <SubNav activeTab="orders" />

      <main className="page-content">
        <div className="container" style={{ maxWidth: "1000px" }}>
          {/* Status Tabs Header */}
          <div
            className="card"
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--border-light)",
              marginBottom: "16px",
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            <div style={{ display: "flex", minWidth: "600px" }}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1,
                      padding: "14px 12px",
                      border: "none",
                      borderBottom: isActive ? "3px solid var(--primary)" : "3px solid transparent",
                      backgroundColor: "transparent",
                      color: isActive ? "var(--primary)" : "var(--text)",
                      fontWeight: isActive ? "700" : "500",
                      fontSize: "14px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search box for orders */}
          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              backgroundColor: "var(--surface-muted)",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--border-light)",
              marginBottom: "16px",
            }}
          >
            <Search size={18} color="var(--text-tertiary)" />
            <input
              type="text"
              placeholder="Tìm kiếm theo Tên Shop, ID Đơn Hàng hoặc Tên Sản Phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "13px",
              }}
            />
          </div>

          {/* Orders List Content */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Skeleton count={3} height="180px" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Chưa có đơn hàng nào"
              description="Bạn chưa có đơn hàng nào ở trạng thái này. Hãy dạo quanh mua sắm ngay nhé!"
              actionText="Khám phá sản phẩm ngay"
              onAction={() => (window.location.href = "/products")}
            />
          ) : (
            <div>
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onCancelOrder={handleCancelOrder}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
