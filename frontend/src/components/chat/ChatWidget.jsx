import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Store,
  Sparkles,
  ChevronLeft,
  Image as ImageIcon,
  Loader2,
  Trash2,
  CheckCheck,
} from "lucide-react";
import { chatService, openChatWithShop } from "../../services/chatService";
import { useAuth } from "../../pages/Authcontext";
import { toFullImageUrl } from "../../utils/auth";

export { openChatWithShop };

export default function ChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const currentUserId = user?.userId;

  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [pendingImages, setPendingImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [unreadTotal, setUnreadTotal] = useState(0);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load conversations list
  const loadConversations = async () => {
    if (!currentUserId) return;
    try {
      const list = await chatService.getConversations();
      setConversations(list || []);
      const total = (list || []).reduce(
        (sum, c) => sum + (c.unreadCountForUser || 0),
        0
      );
      setUnreadTotal(total);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  // Poll conversations every 15s for unread count
  useEffect(() => {
    if (!currentUserId) return;
    loadConversations();
    const interval = setInterval(loadConversations, 15000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  // Load messages for a specific conversation
  const loadMessages = async (conversationId, silent = false) => {
    if (!silent) setMsgLoading(true);
    try {
      const list = await chatService.getMessages(conversationId);
      setMessages(list || []);
    } catch (err) {
      if (!silent) setErrorMsg("Không thể tải tin nhắn");
    } finally {
      if (!silent) setMsgLoading(false);
    }
  };

  // Open conversation and mark as read
  const handleOpenConversation = async (conv) => {
    setActiveConv(conv);
    setErrorMsg("");
    await loadMessages(conv.id, false);
    await chatService.markAsRead(conv.id);
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unreadCountForUser: 0 } : c))
    );
  };

  // Back to list
  const handleBackToList = () => {
    setActiveConv(null);
    setMessages([]);
    setDraft("");
    setPendingImages([]);
    setImagePreviews([]);
    loadConversations();
  };

  // Real-time polling when active conversation is open
  useEffect(() => {
    if (!isOpen || !activeConv) return;
    const interval = setInterval(() => {
      loadMessages(activeConv.id, true);
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, activeConv]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Listen for global "domix:open-chat" event
  useEffect(() => {
    const handleOpenWithShop = async (e) => {
      const shopId = e.detail?.shopId;
      if (!shopId) return;
      setIsOpen(true);
      setErrorMsg("");
      try {
        const conv = await chatService.getOrCreateConversation(shopId);
        if (conv) {
          setConversations((prev) => {
            const exists = prev.some((c) => c.id === conv.id);
            return exists ? prev.map((c) => (c.id === conv.id ? conv : c)) : [conv, ...prev];
          });
          await handleOpenConversation(conv);
        }
      } catch (err) {
        setErrorMsg("Không thể mở chat với shop.");
      }
    };

    window.addEventListener("domix:open-chat", handleOpenWithShop);
    return () => window.removeEventListener("domix:open-chat", handleOpenWithShop);
  }, [currentUserId]);

  // Handle image attachment selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setPendingImages((prev) => [...prev, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removePendingImage = (index) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!activeConv || (!draft.trim() && pendingImages.length === 0)) return;

    setSending(true);
    setErrorMsg("");
    const textToSend = draft.trim();
    const imagesToSend = [...pendingImages];

    setDraft("");
    setPendingImages([]);
    setImagePreviews([]);

    try {
      const newMsg = await chatService.sendMessage(
        activeConv.id,
        textToSend,
        currentUserId || "user",
        "USER",
        imagesToSend
      );

      if (newMsg) {
        setMessages((prev) => [...prev, newMsg]);
      }
      loadConversations();
    } catch (err) {
      setErrorMsg(err.message || "Gửi tin nhắn thất bại");
    } finally {
      setSending(false);
    }
  };

  // Helper: Shop avatar initial
  const getInitials = (name) => (name || "Shop").trim().charAt(0).toUpperCase();

  return (
    <>
      {/* Floating Chat Trigger Button */}
      {!isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
          }}
        >
          <button
            onClick={() => {
              setIsOpen(true);
              loadConversations();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "var(--primary)",
              color: "#ffffff",
              border: "none",
              borderRadius: "28px",
              padding: "12px 20px",
              boxShadow: "0 6px 20px rgba(238, 77, 45, 0.4)",
              fontWeight: "700",
              fontSize: "14px",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              position: "relative",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <MessageCircle size={20} />
            <span>Chat với Shop</span>

            {unreadTotal > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  backgroundColor: "#ffffff",
                  color: "var(--primary)",
                  borderRadius: "10px",
                  padding: "1px 6px",
                  fontSize: "11px",
                  fontWeight: "800",
                  border: "2px solid var(--primary)",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                }}
              >
                {unreadTotal > 99 ? "99+" : unreadTotal}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "360px",
            height: "520px",
            backgroundColor: "var(--surface)",
            borderRadius: "16px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid var(--border)",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: "var(--primary)",
              color: "#ffffff",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              {activeConv ? (
                <>
                  <button
                    onClick={handleBackToList}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.2)",
                      border: "none",
                      color: "#ffffff",
                      padding: "4px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      backgroundColor: "#ffffff",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "800",
                      fontSize: "14px",
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(activeConv.shopName)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: "700",
                        fontSize: "14px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {activeConv.shopName || "Cửa hàng DoMix"}
                    </div>
                    <div style={{ fontSize: "11px", opacity: 0.9, display: "flex", alignItems: "center", gap: "4px" }}>
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: "#10b981",
                        }}
                      />
                      <span>Đang hoạt động</span>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Store size={18} />
                  <span style={{ fontWeight: "700", fontSize: "15px" }}>Tin nhắn Chat</span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  padding: "4px",
                  cursor: "pointer",
                  borderRadius: "4px",
                }}
              >
                <Minimize2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  padding: "4px",
                  cursor: "pointer",
                  borderRadius: "4px",
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Error Banner if any */}
          {errorMsg && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                color: "#991b1b",
                fontSize: "12px",
                padding: "6px 12px",
                textAlign: "center",
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* VIEW 1: CONVERSATION LIST */}
          {!activeConv && (
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                backgroundColor: "var(--bg)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {!isAuthenticated && (
                <div style={{ padding: "16px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                  Vui lòng <a href="/login" style={{ color: "var(--primary)", fontWeight: "700" }}>đăng nhập</a> để nhắn tin trực tiếp với Shop
                </div>
              )}

              {conversations.length === 0 && isAuthenticated && (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "32px",
                    textAlign: "center",
                    color: "var(--text-secondary)",
                  }}
                >
                  <MessageCircle size={40} color="var(--border)" style={{ marginBottom: "12px" }} />
                  <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>Chưa có tin nhắn nào</p>
                  <p style={{ fontSize: "12px", marginTop: "4px" }}>
                    Bấm "Chat ngay" tại trang sản phẩm bất kỳ để trò chuyện với Shop
                  </p>
                </div>
              )}

              {conversations.map((conv) => {
                const unread = conv.unreadCountForUser || 0;
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleOpenConversation(conv)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--border-light)",
                      backgroundColor: unread > 0 ? "var(--primary-subtle)" : "var(--surface)",
                      cursor: "pointer",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-muted)")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        unread > 0 ? "var(--primary-subtle)" : "var(--surface)")
                    }
                  >
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        backgroundColor: "var(--primary-light)",
                        color: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "800",
                        fontSize: "16px",
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(conv.shopName)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "2px",
                        }}
                      >
                        <span style={{ fontSize: "13px", fontWeight: unread > 0 ? "800" : "600", color: "var(--text)" }}>
                          {conv.shopName || "Cửa hàng DoMix"}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                          {conv.lastMessageAt
                            ? new Date(conv.lastMessageAt).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: unread > 0 ? "var(--text)" : "var(--text-secondary)",
                          fontWeight: unread > 0 ? "700" : "400",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {conv.lastMessage || "Bắt đầu cuộc trò chuyện..."}
                      </div>
                    </div>

                    {unread > 0 && (
                      <span
                        style={{
                          backgroundColor: "var(--primary)",
                          color: "#ffffff",
                          borderRadius: "10px",
                          padding: "1px 6px",
                          fontSize: "10px",
                          fontWeight: "800",
                        }}
                      >
                        {unread}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: ACTIVE CONVERSATION MESSAGES */}
          {activeConv && (
            <>
              <div
                style={{
                  flex: 1,
                  padding: "14px",
                  overflowY: "auto",
                  backgroundColor: "var(--bg)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {msgLoading && messages.length === 0 && (
                  <div style={{ textAlign: "center", padding: "20px", color: "var(--text-secondary)" }}>
                    <Loader2 size={20} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                    <span style={{ fontSize: "12px" }}>Đang tải tin nhắn...</span>
                  </div>
                )}

                {messages.length === 0 && !msgLoading && (
                  <div style={{ textAlign: "center", padding: "20px", color: "var(--text-secondary)", fontSize: "12px" }}>
                    Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên tới Shop!
                  </div>
                )}

                {messages.map((msg) => {
                  const isUser =
                    msg.senderRole === "USER" ||
                    msg.senderRole === "BUYER" ||
                    msg.senderId === String(currentUserId) ||
                    msg.sender === "user";

                  return (
                    <div
                      key={msg.id || `m-${Math.random()}`}
                      style={{
                        alignSelf: isUser ? "flex-end" : "flex-start",
                        maxWidth: "80%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isUser ? "flex-end" : "flex-start",
                      }}
                    >
                      {/* Image attachments */}
                      {Array.isArray(msg.imageUrls) && msg.imageUrls.length > 0 && (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "4px" }}>
                          {msg.imageUrls.map((url, i) => {
                            const fullUrl = toFullImageUrl(url);
                            return (
                              <a key={i} href={fullUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={fullUrl}
                                  alt="Attachment"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                  style={{
                                    width: "120px",
                                    height: "120px",
                                    objectFit: "cover",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border)",
                                    cursor: "pointer",
                                  }}
                                />
                              </a>
                            );
                          })}
                        </div>
                      )}

                      {/* Text content */}
                      {msg.content && (
                        <div
                          style={{
                            backgroundColor: isUser ? "var(--primary)" : "var(--surface)",
                            color: isUser ? "#ffffff" : "var(--text)",
                            padding: "9px 13px",
                            borderRadius: isUser ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                            fontSize: "13px",
                            lineHeight: "1.4",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                            wordBreak: "break-word",
                          }}
                        >
                          {msg.content}
                        </div>
                      )}

                      <span
                        style={{
                          fontSize: "10px",
                          color: "var(--text-tertiary)",
                          marginTop: "3px",
                        }}
                      >
                        {msg.sentAt
                          ? new Date(msg.sentAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : msg.time || ""}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "var(--surface-muted)",
                    display: "flex",
                    gap: "8px",
                    overflowX: "auto",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  {imagePreviews.map((previewUrl, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      <img
                        src={previewUrl}
                        alt="Preview"
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "6px",
                          objectFit: "cover",
                        }}
                      />
                      <button
                        onClick={() => removePendingImage(idx)}
                        style={{
                          position: "absolute",
                          top: "-4px",
                          right: "-4px",
                          backgroundColor: "rgba(0,0,0,0.7)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: "16px",
                          height: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input Bar */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: "10px 12px",
                  backgroundColor: "var(--surface)",
                  borderTop: "1px solid var(--border-light)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    padding: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "6px",
                  }}
                  title="Gửi ảnh"
                >
                  <ImageIcon size={18} />
                </button>

                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Nhập nội dung tin nhắn..."
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: "20px",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />

                <button
                  type="submit"
                  disabled={sending || (!draft.trim() && pendingImages.length === 0)}
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor:
                      sending || (!draft.trim() && pendingImages.length === 0)
                        ? "not-allowed"
                        : "pointer",
                    opacity: sending || (!draft.trim() && pendingImages.length === 0) ? 0.6 : 1,
                    flexShrink: 0,
                  }}
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
