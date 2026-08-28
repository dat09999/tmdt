import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import SubNav from "../components/layout/SubNav";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import { notificationService } from "../services/notificationService";
import { useAuth } from "./Authcontext";
import { Bell, CheckCheck, Tag, Truck, ShieldAlert } from "lucide-react";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications(user?.userId);
      setNotifications(data || []);
    } catch (err) {
      console.error("Fetch notifications failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [user?.userId]);

  const handleMarkAllRead = async () => {
    const updated = await notificationService.markAllAsRead(user?.userId);
    setNotifications([...updated]);
  };

  const handleItemClick = async (notif) => {
    if (!notif.read) {
      await notificationService.markAsRead(user?.userId, notif.id);
    }
    if (notif.link) {
      window.location.href = notif.link;
    }
  };

  const tabs = [
    { id: "ALL", label: "Tất cả" },
    { id: "ORDER", label: "Cập nhật đơn hàng" },
    { id: "PROMO", label: "Khuyến mãi" },
    { id: "SYSTEM", label: "Hệ thống" },
  ];

  const filteredNotifs = notifications.filter((n) => {
    if (activeTab === "ALL") return true;
    return n.type === activeTab;
  });

  return (
    <div className="page-shell">
      <Header />
      <SubNav activeTab="notifications" />

      <main className="page-content">
        <div className="container" style={{ maxWidth: "860px" }}>
          {/* Header & Mark All Read CTA */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <h1 className="section-title" style={{ fontSize: "20px" }}>
              THÔNG BÁO ({notifications.filter((n) => !n.read).length} chưa đọc)
            </h1>

            <button
              onClick={handleMarkAllRead}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                color: "var(--primary)",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              <CheckCheck size={16} />
              <span>Đánh dấu đã đọc tất cả</span>
            </button>
          </div>

          {/* Tabs */}
          <div
            className="card"
            style={{
              display: "flex",
              backgroundColor: "var(--surface)",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--border-light)",
              marginBottom: "16px",
              overflowX: "auto",
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    border: "none",
                    borderBottom: isActive ? "3px solid var(--primary)" : "3px solid transparent",
                    backgroundColor: "transparent",
                    color: isActive ? "var(--primary)" : "var(--text)",
                    fontWeight: isActive ? "700" : "500",
                    fontSize: "13px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Notifications List */}
          {filteredNotifs.length === 0 && !loading ? (
            <EmptyState
              icon={Bell}
              title="Không có thông báo nào"
              description="Bạn chưa có thông báo nào trong phân loại này."
            />
          ) : (
            <div
              className="card"
              style={{
                backgroundColor: "var(--surface)",
                borderRadius: "var(--r-lg)",
                border: "1px solid var(--border-light)",
                overflow: "hidden",
              }}
            >
              {filteredNotifs.map((notif, idx) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                    padding: "16px 20px",
                    backgroundColor: notif.read ? "transparent" : "var(--primary-subtle)",
                    borderBottom: idx === filteredNotifs.length - 1 ? "none" : "1px solid var(--border-light)",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-muted)")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = notif.read ? "transparent" : "var(--primary-subtle)")
                  }
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      backgroundColor: notif.type === "PROMO" ? "#fef3c7" : notif.type === "ORDER" ? "#e0e7ff" : "#fee2e2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      flexShrink: 0,
                    }}
                  >
                    {notif.icon || "🔔"}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "4px",
                      }}
                    >
                      <strong style={{ fontSize: "14px", color: "var(--text)" }}>
                        {notif.title}
                      </strong>
                      <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                        {notif.time}
                      </span>
                    </div>

                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                      {notif.body}
                    </p>
                  </div>

                  {!notif.read && (
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "var(--primary)",
                        marginTop: "6px",
                      }}
                    />
                  )}
                </div>
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