import { useEffect, useState } from "react";
import { API_BASE_URL, authFetch } from "../utils/auth";
import { useAuth } from "./Authcontext";
import Header from "../components/Header";
import "./OrdersPage.css";

const STATUS_MAP = {
  PENDING:    { label: "Chờ xác nhận", cls: "status-pending" },
  PROCESSING: { label: "Đang xử lý",   cls: "status-processing" },
  SHIPPING:   { label: "Đang giao",    cls: "status-shipping" },
  DELIVERED:  { label: "Đã giao",      cls: "status-delivered" },
  CANCELLED:  { label: "Đã huỷ",       cls: "status-cancelled" },
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(() => {
    const value = sessionStorage.getItem("orderSuccessMessage") || "";
    sessionStorage.removeItem("orderSuccessMessage");
    return value;
  });
  const [activeTab, setActiveTab] = useState("ALL");
  useEffect(() => {
    if (!user?.userId) { window.location.href = "/login"; return; }
    (async () => {
      try {
        setLoading(true);
        const data = await authFetch(`${API_BASE_URL}/orders/buyer/${user.userId}`);
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) { setMessage(err.message || "Không tải được đơn hàng"); }
      finally { setLoading(false); }
    })();
  }, []);

  const tabs = [
    { id:"ALL", label:"Tất cả" },
    { id:"PENDING", label:"Chờ xác nhận" },
    { id:"PROCESSING", label:"Đang xử lý" },
    { id:"SHIPPING", label:"Đang giao" },
    { id:"DELIVERED", label:"Đã giao" },
    { id:"CANCELLED", label:"Đã huỷ" },
  ];

  const filtered = activeTab === "ALL" ? orders : orders.filter(o => (o.orderStatus||"").toUpperCase() === activeTab);

  return (
    <div className="orders-page">
      <Header />

      <div className="orders-body">
        {message && <div className="orders-message">{message}</div>}

        <div className="orders-tabs">
          {tabs.map(t => (
            <button key={t.id} className={`orders-tab${activeTab===t.id?" active":""}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="orders-empty">Đang tải đơn hàng...</div>
        ) : filtered.length === 0 ? (
          <div className="orders-empty">Chưa có đơn hàng nào.</div>
        ) : (
          <div className="orders-list">
            {filtered.map((order) => {
              const statusKey = (order.orderStatus||"").toUpperCase();
              const status = STATUS_MAP[statusKey] || { label: order.orderStatus||"Không rõ", cls:"status-default" };
              return (
                <div key={order.id} className="order-card">
                  <div className="order-card-head">
                    <div>
                      <div className="order-card-id"><span>Mã đơn:</span>#{order.orderCode || order.id}</div>
                      <div className="order-card-date">{order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "—"}</div>
                    </div>
                    <span className={`order-status-chip ${status.cls}`}>{status.label}</span>
                  </div>

                  <div className="order-items-preview">
                    {(order.items||[]).slice(0,3).map((item, idx) => (
                      <div key={idx} className="order-item">
                        <img src={item.image || "https://via.placeholder.com/56"} alt={item.productName||item.productId} />
                        <div className="order-item-info">
                          <div className="order-item-name">{item.productName || item.productId}</div>
                          <div className="order-item-sku">Phân loại: {item.variantSku||"—"}</div>
                          <div className="order-item-qty">x{item.quantity}</div>
                        </div>
                        <div className="order-item-price">{(item.price||0).toLocaleString()}đ</div>
                      </div>
                    ))}
                    {(order.items||[]).length > 3 && <div className="order-more-items">+{order.items.length - 3} sản phẩm khác</div>}
                  </div>

                  <div className="order-card-foot">
                    <div className="order-total">Thành tiền: <strong>{(order.totalAmount||0).toLocaleString()}đ</strong></div>
                    <div className="order-foot-actions">
                      {statusKey === "DELIVERED" && <button className="btn-secondary">Đánh giá</button>}
                      <button className="btn-primary" onClick={() => window.location.href = `/orders/${order.id||order.orderCode}`}>Xem chi tiết</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
