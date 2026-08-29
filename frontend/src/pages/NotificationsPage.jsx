import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import SubNav from "../components/layout/SubNav";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import { notificationService } from "../services/notificationService";
import { useAuth } from "./Authcontext";
import { formatTimeAgo } from "../utils/formatters";
import { Bell, CheckCheck, Tag, Truck, ShieldAlert, Sparkles, ExternalLink } from "lucide-react";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = notificationService.subscribe(({ notifications: list, unreadCount: count }) => {
      setNotifications(list || []);
      setUnreadCount(count || 0);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.userId]);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
  };

  const handleItemClick = async (notif) => {
    if (!notif.read) {
      await notificationService.markAsRead(notif.id);
    }
    if (notif.link) {
      window.location.href = notif.link;
    }
  };

  const tabs = [
    { id: "ALL", label: `Tất cả (${notifications.length})` },
    { id: "ORDER", label: `Cập nhật đơn hàng (${notifications.filter((n) => n.type === "ORDER").length})` },
    { id: "PROMO", label: `Khuyến mãi (${notifications.filter((n) => n.type === "PROMO").length})` },
    { id: "SYSTEM", label: `Hệ thống (${notifications.filter((n) => n.type === "SYSTEM").length})` },
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
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 className="section-title" style={{ fontSize: "20px", margin: 0 }}>
                THÔNG BÁO CỦA BẠN
              </h1>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: "var(--primary-light)",
                    color: "var(--primary)",
                    fontSize: "12px",
                    fontWeight: "800",
                    padding: "2px 8px",
                    borderRadius: "99px",
                  }}
                >
                  {unreadCount} chưa đọc
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  color: "var(--primary)",
                  fontWeight: "700",
                  cursor: "pointer",
                  background: "transparent",
                  border: "none",
                }}
              >
                <CheckCheck size={16} />
                <span>Đánh dấu đã đọc tất cả</span>
              </button>
            )}
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
                    fontWeight: isActive ? "800" : "500",
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
              {filteredNotifs.map((n) => {
                const isUnread = !n.read;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    style={{
                      padding: "18px 20px",
                      display: "flex",
                      gap: "16px",
                      alignItems: "flex-start",
                      borderBottom: "1px solid var(--border-light)",
                      backgroundColor: isUnread ? "rgba(238, 77, 45, 0.04)" : "#ffffff",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-muted)")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = isUnread
                        ? "rgba(238, 77, 45, 0.04)"
                        : "#ffffff")
                    }
                  >
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        backgroundColor:
                          n.type === "ORDER"
                            ? "#e0f2fe"
                            : n.type === "PROMO"
                            ? "#fef3c7"
                            : "var(--primary-light)",
                        color:
                          n.type === "ORDER"
                            ? "#0284c7"
                            : n.type === "PROMO"
                            ? "#d97706"
                            : "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {n.type === "ORDER" ? (
                        <Truck size={20} />
                      ) : n.type === "PROMO" ? (
                        <Tag size={20} />
                      ) : (
                        <Bell size={20} />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: isUnread ? "800" : "600",
                          color: isUnread ? "var(--text)" : "var(--text-secondary)",
                          marginBottom: "4px",
                        }}
                      >
                        {n.title}
                      </div>

                      <div
                        style={{
                          fontSize: "13px",
                          color: "var(--text-secondary)",
                          lineHeight: "1.5",
                        }}
                      >
                        {n.content}
                      </div>

                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-tertiary)",
                          marginTop: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span>{formatTimeAgo(n.time)}</span>
                        {n.link && (
                          <>
                            <span>•</span>
                            <span style={{ color: "var(--primary)", fontWeight: "600" }}>
                              Xem chi tiết →
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {isUnread && (
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          backgroundColor: "var(--primary)",
                          marginTop: "6px",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}