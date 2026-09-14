import { Client } from "@stomp/stompjs";
import { API_BASE_URL, getAccessToken, onAuthChange } from "../utils/auth";
import { notificationService } from "./notificationService";

let stompClient = null;
let currentSub = null;

function getWsBrokerUrl() {
  const base = (API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
  const proto = base.startsWith("https") ? "wss" : "ws";
  const host = base.replace(/^https?:\/\//, "");
  return `${proto}://${host}/ws`;
}

export const websocketService = {
  connect() {
    const token = getAccessToken();
    if (!token) {
      this.disconnect();
      return;
    }

    if (stompClient && stompClient.active) {
      return; // Đã kết nối
    }

    const brokerURL = getWsBrokerUrl();

    stompClient = new Client({
      brokerURL,
      connectHeaders: {
        Authorization: Bearer ,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        // Đăng ký nhận thông báo cá nhân Realtime từ backend
        // Backend bắn tới: /user/{userId}/queue/notifications -> Client subscribe /user/queue/notifications
        if (currentSub) {
          try { currentSub.unsubscribe(); } catch {}
        }
        currentSub = stompClient.subscribe("/user/queue/notifications", (message) => {
          try {
            const notif = JSON.parse(message.body);
            notificationService.handleIncomingRealtime(notif);
          } catch (e) {
            console.error("Lỗi phân tích thông báo realtime:", e);
          }
        });
      },
      onStompError: (frame) => {
        console.warn("Lỗi STOMP WebSocket:", frame.headers?.["message"]);
      },
    });

    stompClient.activate();
  },

  disconnect() {
    if (currentSub) {
      try { currentSub.unsubscribe(); } catch {}
      currentSub = null;
    }
    if (stompClient) {
      try { stompClient.deactivate(); } catch {}
      stompClient = null;
    }
  },

  getClient() {
    return stompClient;
  },

  // Đăng ký nhận tin nhắn Realtime cho một cuộc hội thoại cụ thể
  subscribeConversation(conversationId, onMessage, onRead, onDeleted) {
    if (!conversationId) return () => {};

    if (!stompClient || !stompClient.active) {
      this.connect();
    }

    const subs = [];

    const doSubscribe = () => {
      if (!stompClient || !stompClient.connected) return;

      // 1. Nhận tin nhắn mới tức thì (0.1s)
      subs.push(
        stompClient.subscribe(`/topic/conversations/${conversationId}`, (msgFrame) => {
          try {
            const newMsg = JSON.parse(msgFrame.body);
            if (onMessage) onMessage(newMsg);
          } catch (e) {
            console.error("Parse chat message error:", e);
          }
        })
      );

      // 2. Nhận sự kiện đã đọc
      subs.push(
        stompClient.subscribe(`/topic/conversations/${conversationId}/read`, (readFrame) => {
          try {
            if (onRead) onRead(readFrame.body);
          } catch (e) {
            console.error("Parse read event error:", e);
          }
        })
      );

      // 3. Nhận sự kiện thu hồi tin nhắn
      subs.push(
        stompClient.subscribe(`/topic/conversations/${conversationId}/deleted`, (delFrame) => {
          try {
            if (onDeleted) onDeleted(delFrame.body);
          } catch (e) {
            console.error("Parse delete event error:", e);
          }
        })
      );
    };

    if (stompClient && stompClient.connected) {
      doSubscribe();
    } else {
      const timer = setInterval(() => {
        if (stompClient && stompClient.connected) {
          clearInterval(timer);
          doSubscribe();
        }
      }, 300);
      subs.push({ unsubscribe: () => clearInterval(timer) });
    }

    return () => {
      subs.forEach((sub) => {
        try {
          sub.unsubscribe();
        } catch {}
      });
    };
  },
};

// Tự động lắng nghe trạng thái đăng nhập để bật/tắt WebSocket
onAuthChange(({ accessToken }) => {
  if (accessToken) {
    websocketService.connect();
  } else {
    websocketService.disconnect();
  }
});
