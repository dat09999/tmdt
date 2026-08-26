import { useEffect, useRef, useState } from "react";
import { API_BASE_URL, authFetch } from "../utils/auth";
import { useAuth } from "../pages/Authcontext";
import "./ChatWidget.css";

// Gọi từ bất kỳ đâu (VD: nút "Chat với shop" trên trang sản phẩm) để mở
// widget và tự tạo/mở đúng hội thoại với shop đó.
export function openChatWithShop(shopId) {
  window.dispatchEvent(new CustomEvent("domix:open-chat", { detail: { shopId } }));
}

export default function ChatWidget() {
  const { user } = useAuth();
  const currentUserId = user?.userId;

  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(true);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [pendingImages, setPendingImages] = useState([]);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const messagesEndRef = useRef(null);

  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unreadCountForUser || 0), 0);

  const loadConversations = async () => {
    try {
      const data = await authFetch(`${API_BASE_URL}/api/chat/conversations/me`);
      setConversations(Array.isArray(data) ? data : []);
    } catch (e) {
      setChatError(e.message || "Không thể tải hội thoại.");
    }
  };

  // Poll nhẹ để cập nhật badge tin chưa đọc kể cả khi đang đóng widget
  useEffect(() => {
    if (!currentUserId) return;
    (async () => { setConvLoading(true); await loadConversations(); setConvLoading(false); })();
    const interval = setInterval(loadConversations, 15000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  const loadMessages = async (conversationId, { silent } = {}) => {
    if (!silent) setMsgLoading(true);
    try {
      const data = await authFetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/messages?page=0&size=30`);
      setMessages(Array.isArray(data?.content) ? [...data.content].reverse() : []);
    } catch (e) {
      setChatError(e.message || "Không thể tải tin nhắn.");
    } finally {
      if (!silent) setMsgLoading(false);
    }
  };

  const openConversation = async (conv) => {
    setActiveConv(conv);
    setChatError("");
    await loadMessages(conv.id);
    try {
      await authFetch(`${API_BASE_URL}/api/chat/conversations/${conv.id}/read`, { method: "PATCH" });
      setConversations((current) => current.map((c) => c.id === conv.id ? { ...c, unreadCountForUser: 0 } : c));
    } catch {
      // không chặn luồng chat nếu mark-as-read lỗi
    }
  };

  const backToList = () => {
    setActiveConv(null);
    setMessages([]);
    setDraft("");
    setPendingImages([]);
  };

  // Cho phép mở thẳng 1 hội thoại theo shopId từ trang khác (VD: trang sản phẩm)
  const startWithShop = async (shopId) => {
    setOpen(true);
    setChatError("");
    try {
      const conv = await authFetch(`${API_BASE_URL}/api/chat/conversations?shopId=${shopId}`, { method: "POST" });
      setConversations((current) => {
        const exists = current.some((c) => c.id === conv.id);
        return exists ? current.map((c) => c.id === conv.id ? conv : c) : [conv, ...current];
      });
      await openConversation(conv);
    } catch (e) {
      setChatError(e.message || "Không thể mở chat với shop.");
    }
  };

  useEffect(() => {
    const handler = (e) => startWithShop(e.detail.shopId);
    window.addEventListener("domix:open-chat", handler);
    return () => window.removeEventListener("domix:open-chat", handler);
  }, []);

  useEffect(() => {
    if (!open || !activeConv) return;
    const interval = setInterval(() => loadMessages(activeConv.id, { silent: true }), 4000);
    return () => clearInterval(interval);
  }, [open, activeConv]);

  useEffect(() => {
    if (open && activeConv) loadConversations();
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleImagePick = (e) => {
    const files = Array.from(e.target.files || []);
    setPendingImages((current) => [...current, ...files]);
    e.target.value = "";
  };

  const removePendingImage = (index) => {
    setPendingImages((current) => current.filter((_, i) => i !== index));
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!activeConv || (!draft.trim() && !pendingImages.length)) return;
    setSending(true); setChatError("");
    try {
      const formData = new FormData();
      formData.append("conversationId", activeConv.id);
      formData.append("senderId", String(currentUserId));
      formData.append("senderRole", "USER");
      if (draft.trim()) formData.append("content", draft.trim());
      pendingImages.forEach((file) => formData.append("images", file));

      const created = await authFetch(`${API_BASE_URL}/api/chat/messages`, { method: "POST", body: formData });
      setMessages((current) => [...current, created]);
      setDraft("");
      setPendingImages([]);
      loadConversations();
    } catch (e) {
      setChatError(e.message || "Không thể gửi tin nhắn.");
    } finally {
      setSending(false);
    }
  };

  const initials = (name) => (name || "S").trim().charAt(0).toUpperCase();

  // Chưa đăng nhập thì không hiện icon chat ở bất kỳ trang nào
  if (!currentUserId) return null;

  return (
    <>
      <button
        type="button"
        className={`chat-fab${open ? " is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Đóng khung chat" : "Mở khung chat"}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 1 1 3.2 6.4L4 20l1.2-3.4A7.96 7.96 0 0 1 4 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
        )}
        {!open && unreadTotal > 0 && <span className="chat-fab-badge">{unreadTotal > 9 ? "9+" : unreadTotal}</span>}
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-panel-header">
            {activeConv ? (
              <>
                <button type="button" className="chat-back-btn" onClick={backToList} aria-label="Quay lại">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <div className="chat-header-shop">
                  <span className="chat-avatar">{initials(activeConv.shopName)}</span>
                  <span className="chat-header-name">{activeConv.shopName || `Shop #${activeConv.shopId}`}</span>
                </div>
              </>
            ) : (
              <span className="chat-header-name">Tin nhắn với shop</span>
            )}
          </div>

          {chatError && <div className="chat-panel-alert">{chatError}</div>}

          {!activeConv ? (
            <div className="chat-conv-list">
              {convLoading ? (
                <p className="chat-empty">Đang tải hội thoại...</p>
              ) : conversations.length ? (
                conversations.map((c) => (
                  <button key={c.id} type="button" className="chat-conv-item" onClick={() => openConversation(c)}>
                    <span className="chat-avatar">{initials(c.shopName)}</span>
                    <span className="chat-conv-item-body">
                      <span className="chat-conv-item-top">
                        <strong>{c.shopName || `Shop #${c.shopId}`}</strong>
                        {c.unreadCountForUser > 0 && <span className="chat-unread-dot">{c.unreadCountForUser}</span>}
                      </span>
                      <span className="chat-conv-item-last">
                        {c.lastMessageType === "IMAGE" ? "[Hình ảnh]" : (c.lastMessage || "Chưa có tin nhắn")}
                      </span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="chat-empty-state">
                  <span>💬</span>
                  <p>Bạn chưa có hội thoại nào.</p>
                  <small>Vào trang sản phẩm và bấm "Chat với shop" để bắt đầu.</small>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="chat-messages">
                {msgLoading ? (
                  <p className="chat-empty">Đang tải tin nhắn...</p>
                ) : messages.length ? (
                  messages.map((m) => (
                    <div key={m.id} className={`chat-bubble${m.senderRole === "USER" ? " mine" : ""}`}>
                      {m.content && <p>{m.content}</p>}
                      {m.imageUrls?.length > 0 && (
                        <div className="chat-bubble-images">
                          {m.imageUrls.map((url, i) => <img key={i} src={url} alt="" />)}
                        </div>
                      )}
                      <span className="chat-bubble-time">{m.sentAt ? new Date(m.sentAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                    </div>
                  ))
                ) : (
                  <p className="chat-empty">Hãy gửi lời chào đầu tiên tới shop 👋</p>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-composer" onSubmit={sendMessage}>
                {pendingImages.length > 0 && (
                  <div className="chat-pending-images">
                    {pendingImages.map((file, i) => (
                      <span key={i} className="chat-pending-image">
                        {file.name}
                        <button type="button" onClick={() => removePendingImage(i)}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="chat-composer-row">
                  <label className="chat-attach-btn">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M21 12.5l-8.5 8.5a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 1 1-3-3l8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <input type="file" accept="image/*" multiple hidden onChange={handleImagePick} />
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập tin nhắn..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <button type="submit" className="chat-send-btn" disabled={sending || (!draft.trim() && !pendingImages.length)} aria-label="Gửi">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 12l16-8-6 16-3-6-7-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
