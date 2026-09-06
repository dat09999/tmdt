import { API_BASE_URL, authFetch, getCurrentUser } from "../utils/auth";
import { safeFetch } from "./api";
import { MOCK_NOTIFICATIONS } from "../mocks/mockNotifications";

const listeners = new Set();
let pollingTimer = null;
let lastKnownNotifIds = new Set();
let cachedUnreadCount = 0;
let cachedNotifications = [];

function notifyListeners(data) {
  listeners.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error("Notification listener error:", e);
    }
  });
}

export const notificationService = {
  // GET /notifications?page=0&size=20
  async getNotifications(page = 0, size = 20) {
    if (!getCurrentUser()?.userId) {
      return [];
    }
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/notifications?page=${page}&size=${size}`);
        const items = Array.isArray(res?.content)
          ? res.content
          : Array.isArray(res)
          ? res
          : [];

        // Normalize notification items
        const normalized = items.map((n) => ({
          id: n.id || `notif-${Date.now()}`,
          title: n.title || "Thông báo hệ thống",
          content: n.content || n.message || n.body || "",
          time: n.createdAt || n.time || new Date().toISOString(),
          read: typeof n.read === "boolean" ? n.read : !!n.isRead,
          type: (n.type || "SYSTEM").toUpperCase(),
          link: n.link || n.url || (n.referenceId ? `/orders/${n.referenceId}` : "/notifications"),
          image: n.image || n.icon || null,
        }));

        cachedNotifications = normalized;
        cachedUnreadCount = normalized.filter((n) => !n.read).length;
        return normalized;
      },
      MOCK_NOTIFICATIONS
    );
  },

  // GET /notifications/unread-count
  async getUnreadCount() {
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/notifications/unread-count`);
        if (typeof res === "number") return res;
        if (typeof res?.unreadCount === "number") return res.unreadCount;
        if (typeof res?.count === "number") return res.count;

        // Fallback: fetch latest list to count unread
        const list = await this.getNotifications(0, 10);
        return list.filter((n) => !n.read).length;
      },
      cachedUnreadCount
    );
  },

  // POST /notifications/{id}/read
  async markAsRead(notifId) {
    if (!notifId) return;

    // Optimistic local update
    cachedNotifications = cachedNotifications.map((n) =>
      n.id === notifId ? { ...n, read: true } : n
    );
    cachedUnreadCount = cachedNotifications.filter((n) => !n.read).length;
    notifyListeners({
      notifications: cachedNotifications,
      unreadCount: cachedUnreadCount,
    });

    return safeFetch(async () => {
      return await authFetch(`${API_BASE_URL}/notifications/${notifId}/read`, {
        method: "POST",
      });
    }, null);
  },

  // POST /notifications/read-all
  async markAllAsRead() {
    // Optimistic local update
    cachedNotifications = cachedNotifications.map((n) => ({ ...n, read: true }));
    cachedUnreadCount = 0;
    notifyListeners({
      notifications: cachedNotifications,
      unreadCount: 0,
    });

    return safeFetch(async () => {
      return await authFetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "POST",
      });
    }, null);
  },

  // Realtime subscription / polling mechanism
  subscribe(callback) {
    listeners.add(callback);

    // Initial emit
    callback({
      notifications: cachedNotifications,
      unreadCount: cachedUnreadCount,
    });

    // Start background polling if not already running
    if (!pollingTimer) {
      this.startPolling();
    }

    return () => {
      listeners.delete(callback);
      if (listeners.size === 0 && pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
      }
    };
  },

  startPolling(intervalMs = 4000) {
    if (pollingTimer) clearInterval(pollingTimer);

    const checkUpdates = async () => {
      try {
        const notifs = await this.getNotifications(0, 15);
        const unread = notifs.filter((n) => !n.read).length;

        // Check if there are newly arrived notifications
        const currentIds = new Set(notifs.map((n) => n.id));
        const newUnread = notifs.filter((n) => !n.read && !lastKnownNotifIds.has(n.id));

        if (lastKnownNotifIds.size > 0 && newUnread.length > 0) {
          // Trigger browser notification event / toast alert
          window.dispatchEvent(
            new CustomEvent("DOMIX_NEW_NOTIFICATION", {
              detail: newUnread[0],
            })
          );
        }

        lastKnownNotifIds = currentIds;
        cachedNotifications = notifs;
        cachedUnreadCount = unread;

        notifyListeners({
          notifications: notifs,
          unreadCount: unread,
        });
      } catch (err) {
        // Silent background polling error
      }
    };

    // Run first check immediately
    checkUpdates();

    // Poll every 4 seconds
    pollingTimer = setInterval(checkUpdates, intervalMs);
  },
};
