import { API_BASE_URL, authFetch } from "../utils/auth";
import { safeFetch } from "./api";
import { MOCK_CONVERSATIONS } from "../mocks/mockChat";

export function openChatWithShop(shopId) {
  window.dispatchEvent(new CustomEvent("domix:open-chat", { detail: { shopId } }));
}

export const chatService = {
  // GET /api/chat/conversations/me
  async getConversations() {
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/api/chat/conversations/me`);
        return Array.isArray(res) ? res : [];
      },
      MOCK_CONVERSATIONS
    );
  },

  // POST /api/chat/conversations?shopId=...
  async getOrCreateConversation(shopId) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/api/chat/conversations?shopId=${encodeURIComponent(shopId)}`, {
          method: "POST",
        });
      },
      MOCK_CONVERSATIONS.find((c) => c.shopId === shopId) || MOCK_CONVERSATIONS[0]
    );
  },

  // GET /api/chat/conversations/{conversationId}/messages?page=0&size=30
  async getMessages(conversationId, page = 0, size = 30) {
    return safeFetch(
      async () => {
        const res = await authFetch(
          `${API_BASE_URL}/api/chat/conversations/${conversationId}/messages?page=${page}&size=${size}`
        );
        if (Array.isArray(res?.content)) {
          return [...res.content].reverse();
        }
        if (Array.isArray(res)) {
          return [...res].reverse();
        }
        return [];
      },
      (() => {
        const conv = MOCK_CONVERSATIONS.find((c) => c.id === conversationId);
        return conv?.messages || [];
      })()
    );
  },

  // POST /api/chat/messages (multipart/form-data)
  async sendMessage(conversationId, text, senderId, senderRole = "USER", files = []) {
    return safeFetch(
      async () => {
        const formData = new FormData();
        formData.append("conversationId", conversationId);
        formData.append("senderId", String(senderId || "user"));
        formData.append("senderRole", senderRole);
        if (text && text.trim()) {
          formData.append("content", text.trim());
        }
        if (files && files.length > 0) {
          files.forEach((file) => formData.append("images", file));
        }

        return await authFetch(`${API_BASE_URL}/api/chat/messages`, {
          method: "POST",
          body: formData,
        });
      },
      {
        id: `msg-${Date.now()}`,
        conversationId,
        senderId: String(senderId || "user"),
        senderRole,
        content: text,
        sentAt: new Date().toISOString(),
        read: false,
      }
    );
  },

  // PATCH /api/chat/conversations/{conversationId}/read
  async markAsRead(conversationId) {
    try {
      await authFetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/read`, {
        method: "PATCH",
      });
    } catch {}
  },

  // GET /api/chat/unread-count
  async getUnreadCount() {
    return safeFetch(async () => {
      const res = await authFetch(`${API_BASE_URL}/api/chat/unread-count`);
      return res?.total || res?.unreadCount || 0;
    }, 0);
  },
};
