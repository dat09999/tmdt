import { API_BASE_URL, authFetch } from "../utils/auth";
import { safeFetch } from "./api";
import { MOCK_NOTIFICATIONS } from "../mocks/mockNotifications";

const NOTIF_KEY = "domix_notifications";

function getLocalNotifications() {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    return raw ? JSON.parse(raw) : MOCK_NOTIFICATIONS;
  } catch {
    return MOCK_NOTIFICATIONS;
  }
}

function saveLocalNotifications(notifs) {
  try {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
  } catch {}
}

export const notificationService = {
  // Lấy danh sách thông báo
  async getNotifications(userId) {
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/notifications/${userId}`);
        return Array.isArray(res) ? res : [];
      },
      getLocalNotifications()
    );
  },

  // Đánh dấu 1 thông báo đã đọc
  async markAsRead(userId, notifId) {
    const list = getLocalNotifications();
    const target = list.find((n) => n.id === notifId);
    if (target) target.read = true;
    saveLocalNotifications(list);

    if (userId) {
      safeFetch(async () => {
        return await authFetch(`${API_BASE_URL}/notifications/${userId}/${notifId}/read`, {
          method: "PUT",
        });
      }, null);
    }
    return list;
  },

  // Đánh dấu tất cả là đã đọc
  async markAllAsRead(userId) {
    const list = getLocalNotifications();
    list.forEach((n) => (n.read = true));
    saveLocalNotifications(list);

    if (userId) {
      safeFetch(async () => {
        return await authFetch(`${API_BASE_URL}/notifications/${userId}/read-all`, {
          method: "PUT",
        });
      }, null);
    }
    return list;
  },
};
