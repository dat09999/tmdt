import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import { API_BASE_URL, authFetch, getAccessToken, onAuthChange } from "../utils/auth";
import { useAuth } from "./Authcontext";
import Header from "../components/Header";
import "./NotificationsPage.css";

const ICON_MAP = {
  order_status: "📦",
  review_reply: "💬",
  chat_message: "✉️",
  promotion: "🎁",
  system: "⚙️",
};

// TODO: xác nhận đúng path WebSocket - đang giả định khớp WebSocketConfig.registerStompEndpoints("/ws")
// và API_BASE_URL cùng domain/port với backend REST. Nếu WS chạy ở domain/port khác, sửa lại URL này.
const WS_URL = (API_BASE_URL || "").replace(/^http/, "ws") + "/ws";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  // accessToken không có trong AuthContext -> lấy trực tiếp từ utils/auth và
  // đồng bộ qua onAuthChange, vì đây là biến module thường, không phải React state,
  // nên khi refreshAccessToken() chạy ngầm (ví dụ trong authFetch lúc gặp 401),
  // component cần được báo để reconnect WS với token mới.
  const [accessToken, setAccessToken] = useState(getAccessToken());
  const stompClientRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(({ accessToken: nextToken }) => {
      setAccessToken(nextToken);
    });
    return unsubscribe;
  }, []);

  // ── Tải danh sách thông báo lúc vào trang ──
  useEffect(() => {
    if (!user?.userId) {
      window.location.href = "/login";
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const data = await authFetch(`${API_BASE_URL}/notifications?page=0&size=20`);

        // backend trả về Page<Notification> (Spring Data) -> danh sách thật nằm
        // trong data.content, không phải data trực tiếp.
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.content)
          ? data.content
          : [];

        if (!cancelled) setNotifications(list);
      } catch (err) {
        if (!cancelled) setMessage(err.message || "Không tải được thông báo");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.userId]);

  // ── Kết nối WebSocket để nhận thông báo mới ngay lập tức, không cần F5 ──
  useEffect(() => {
    if (!user?.userId || !accessToken) return;

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000, // tự động reconnect nếu mất kết nối
      onConnect: () => {
        client.subscribe("/user/queue/notifications", (frame) => {
          try {
            const incoming = JSON.parse(frame.body);
            setNotifications((prev) => [incoming, ...prev]);
          } catch {
            // bỏ qua nếu payload không parse được, không làm crash UI
          }
        });
      },
      onStompError: (frame) => {
        // Không chặn UI nếu WS lỗi - trang vẫn dùng được qua REST fetch bình thường,
        // chỉ là không có cập nhật realtime.
        console.warn("STOMP error:", frame.headers?.message);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
      stompClientRef.current = null;
    };
  }, [user?.userId, accessToken]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Nút "Đánh dấu tất cả đã đọc" ──
  const handleMarkAllAsRead = async () => {
    if (markingAll || unreadCount === 0) return;

    setMarkingAll(true);
    const previousState = notifications;

    // Cập nhật lạc quan trên UI trước để cảm giác phản hồi nhanh, rollback nếu API lỗi
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));

    try {
      await authFetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "POST",
      });
    } catch (err) {
      setNotifications(previousState); // rollback nếu lỗi
      setMessage(err.message || "Không thể đánh dấu tất cả đã đọc");
    } finally {
      setMarkingAll(false);
    }
  };

  // ── Click vào 1 thông báo -> đánh dấu đã đọc (nếu chưa đọc) + điều hướng theo actionUrl ──
  const handleNotificationClick = async (notif) => {
    if (notif.read) {
      if (notif.actionUrl) window.location.href = notif.actionUrl;
      return;
    }

    const previousState = notifications;
    setNotifications((list) =>
      list.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );

    try {
      // Khớp NotificationController: POST /notifications/{id}/read
      // userId lấy từ JWT trong Authentication ở backend, không cần gửi qua query param.
      await authFetch(`${API_BASE_URL}/notifications/${notif.id}/read`, {
        method: "POST",
      });
    } catch (err) {
      setNotifications(previousState); // rollback nếu lỗi
      setMessage(err.message || "Không thể đánh dấu đã đọc");
      return;
    }

    if (notif.actionUrl) window.location.href = notif.actionUrl;
  };

  return (
    <div className="notifications-page">
      <Header />

      <div className="notifications-body">
        {message && <div className="notifications-message">{message}</div>}

        <div className="notif-toolbar">
          <h2>
            🔔 Thông báo{" "}
            {unreadCount > 0 && (
              <span className="badge" style={{ marginLeft: 6 }}>
                {unreadCount}
              </span>
            )}
          </h2>
          <button
            className="notif-mark-all"
            onClick={handleMarkAllAsRead}
            disabled={markingAll || unreadCount === 0}
          >
            {markingAll ? "Đang xử lý..." : "Đánh dấu tất cả đã đọc"}
          </button>
        </div>

        {loading ? (
          <div className="notifications-empty">Đang tải thông báo...</div>
        ) : notifications.length === 0 ? (
          <div className="notifications-empty">
            <p>Chưa có thông báo nào.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notif, i) => {
              const isRead = notif.read;
              const type = notif.type?.toLowerCase() || "system";
              const icon = ICON_MAP[type] || "🔔";
              return (
                <div
                  key={notif.id || i}
                  className={`notification-item${isRead ? " read" : " unread"}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className={`notif-icon ${type}`}>{icon}</div>
                  <div className="notif-body">
                    <div className="notif-title">{notif.title || "Thông báo"}</div>
                    <div className="notif-msg">{notif.message || ""}</div>
                  </div>
                  <div className="notif-right">
                    <span className="notif-time">
                      {notif.createdAt
                        ? new Date(notif.createdAt).toLocaleString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                          })
                        : ""}
                    </span>
                    {!isRead && <span className="notif-dot" />}
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