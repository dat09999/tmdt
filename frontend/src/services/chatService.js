import { API_BASE_URL, authFetch } from "../utils/auth";
import { safeFetch } from "./api";
import { MOCK_CONVERSATIONS } from "../mocks/mockChat";

const CHAT_STORAGE_KEY = "domix_mock_chat_data";

function getLocalConversations() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : MOCK_CONVERSATIONS;
  } catch {
    return MOCK_CONVERSATIONS;
  }
}

function saveLocalConversations(convs) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(convs));
  } catch {}
}

export const chatService = {
  // Lấy danh sách cuộc hội thoại
  async getConversations() {
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/chat/conversations`);
        return res;
      },
      getLocalConversations()
    );
  },

  // Gửi tin nhắn mới
  async sendMessage(conversationId, text) {
    const convs = getLocalConversations();
    const conv = convs.find((c) => c.id === conversationId);
    
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text,
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    if (conv) {
      conv.messages.push(newMsg);
      conv.lastMessage = text;
      conv.lastTime = newMsg.time;
      saveLocalConversations(convs);
    }

    // Mock automatic shop reply after 1.5s
    setTimeout(() => {
      const updatedConvs = getLocalConversations();
      const targetConv = updatedConvs.find((c) => c.id === conversationId);
      if (targetConv) {
        targetConv.messages.push({
          id: `msg-reply-${Date.now()}`,
          sender: "shop",
          text: `Cảm ơn bạn đã nhắn tin cho ${targetConv.shopName}! Chúng tôi sẽ phản hồi sớm nhất có thể.`,
          time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        });
        saveLocalConversations(updatedConvs);
        window.dispatchEvent(new CustomEvent("chat_message_received", { detail: { conversationId } }));
      }
    }, 1500);

    return newMsg;
  },
};
