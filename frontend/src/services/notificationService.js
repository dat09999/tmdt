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
  // GET /notifications?page=0&size=20
  async getNotifications(userId, page = 0, size = 20) {
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/notifications?page=${page}&size=${size}`);
        return Array.isArray(res?.content) ? res.content : Array.isArray(res) ? res : getLocalNotifications();
      },
      getLocalNotifications()
    );
  },

  // GET /notifications/unread-count
  async getUnreadCount() {
    return safeFetch(async () => {
      const res = await authFetch(`${API_BASE_URL}/notifications/unread-count`);
      return res?.unreadCount || 0;
    }, 2);
  },

  // POST /notifications/{id}/read
  async markAsRead(userId, notifId) {
    const list = getLocalNotifications();
    const target = list.find((n) => n.id === notifId);
    if (target) target.read = true;
    saveLocalNotifications(list);

    safeFetch(async () => {
      return await authFetch(`${API_BASE_URL}/notifications/${notifId}/read`, {
        method: "POST",
      });
    }, null);

    return list;
  },

  // POST /notifications/read-all
  async markAllAsRead(userId) {
    const list = getLocalNotifications();
    list.forEach((n) => (n.read = true));
    saveLocalNotifications(list);

    safeFetch(async () => {
      return await authFetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "POST",
      });
    }, null);

    return list;
  },
};
