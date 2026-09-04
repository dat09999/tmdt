import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Search,
  Send,
  Image as ImageIcon,
  Sparkles,
  Check,
  CheckCheck,
  User,
  Store,
  Tag,
  Clock,
  RefreshCw,
  X,
  Loader2,
  AlertCircle,
  ShoppingBag,
  ShieldCheck,
  Paperclip,
  Smile,
  ChevronRight,
} from "lucide-react";
import { chatService } from "../../services/chatService";
import { useAuth } from "../../pages/Authcontext";
import { formatCurrency } from "../../utils/formatters";

const QUICK_REPLIES = [
  "Dạ chào bạn, sản phẩm này bên shop vẫn còn sẵn hàng ạ! 🥰",
  "Đơn hàng của bạn đã được đóng gói và chuẩn bị giao cho bên vận chuyển ạ 📦",
  "Cảm ơn bạn đã tin tưởng ủng hộ shop! Chúc bạn một ngày tốt lành ❤️",
  "Sản phẩm được bảo hành chính hãng và hỗ trợ đổi trả miễn phí trong 7 ngày ạ ✨",
  "Dạ bạn cho shop xin thêm thông tin/hình ảnh để shop hỗ trợ ngay nhé!",
];

const getInitials = (name) => {
  if (!name) return "KH";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function SellerChatCenter({ shop, initialSelectedConvId = null }) {
  const { user } = useAuth();
  const shopId = shop?.id || "shop-official";

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // "ALL" | "UNREAD"
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [pendingImages, setPendingImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [toastMessage, setToastMessage] = useState("");

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // 1. Load conversations for this shop
  const loadConversations = async (silent = false) => {
    if (!shopId) return;
    if (!silent) setLoadingList(true);
    try {
      const list = await chatService.getShopConversations(shopId);
      const safeList = Array.isArray(list) ? list : [];
      setConversations(safeList);

      // Auto select first or requested conversation
      if (!activeConv && safeList.length > 0) {
        if (initialSelectedConvId) {
          const match = safeList.find((c) => c.id === initialSelectedConvId);
          if (match) {
            handleSelectConversation(match);
          } else {
            handleSelectConversation(safeList[0]);
          }
        } else {
          handleSelectConversation(safeList[0]);
        }
      }
    } catch (err) {
      console.error("Load shop conversations failed:", err);
    } finally {
      if (!silent) setLoadingList(false);
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(() => {
      loadConversations(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [shopId]);

  // 2. Load messages for active conversation
  const loadMessages = async (convId, silent = false) => {
    if (!convId) return;
    if (!silent) setLoadingMsg(true);
    try {
      const msgList = await chatService.getMessages(convId);
      setMessages(Array.isArray(msgList) ? msgList : []);
    } catch (err) {
      console.error("Load messages failed:", err);
    } finally {
      if (!silent) setLoadingMsg(false);
    }
  };

  // Real-time polling for messages of active conversation
  useEffect(() => {
    if (!activeConv?.id) return;
    loadMessages(activeConv.id, false);
    const interval = setInterval(() => {
      loadMessages(activeConv.id, true);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeConv?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Select a conversation
  const handleSelectConversation = async (conv) => {
    setActiveConv(conv);
    setDraft("");
    setPendingImages([]);
    setImagePreviews([]);
    await chatService.markAsRead(conv.id);
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unreadCountForShop: 0 } : c))
    );
  };

  // Image selection
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
  const handleSendMessage = async (customText = null) => {
    const textToSend = customText !== null ? customText : draft;
    if ((!textToSend || !textToSend.trim()) && pendingImages.length === 0) {
      return;
    }
    if (!activeConv?.id) return;

    try {
      setSending(true);
      const currentSenderId = user?.userId || shop?.ownerId || "seller";
      
      const sentMsg = await chatService.sendMessage(
        activeConv.id,
        textToSend.trim(),
        currentSenderId,
        "SHOP",
        pendingImages
      );

      if (sentMsg) {
        setMessages((prev) => [...prev, sentMsg]);
      }

      setDraft("");
      setPendingImages([]);
      setImagePreviews([]);
      
      // Update last message in list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConv.id
            ? {
                ...c,
                lastMessage: textToSend.trim() || "[Hình ảnh]",
                lastMessageAt: new Date().toISOString(),
              }
            : c
        )
      );
    } catch (err) {
      showToast("Gửi tin nhắn thất bại. Vui lòng thử lại!");
    } finally {
      setSending(false);
    }
  };

  // Send quick reply
  const handleSendQuickReply = (text) => {
    handleSendMessage(text);
  };

  // Filtered conversations
  const filteredConversations = conversations.filter((c) => {
    const buyerDisplayName = c.buyerName || c.userName || c.buyerId || "Khách Hàng";
    const matchesSearch =
      buyerDisplayName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (c.lastMessage && c.lastMessage.toLowerCase().includes(searchKeyword.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (filterType === "UNREAD") {
      return (c.unreadCountForShop || 0) > 0;
    }
    return true;
  });

  const totalUnreadCount = conversations.reduce(
    (sum, c) => sum + (c.unreadCountForShop || 0),
    0
  );

  return (
    <div
      className="card"
      style={{
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        height: "720px",
        backgroundColor: "var(--surface)",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--border-light)",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            right: "20px",
            zIndex: 9999,
            backgroundColor: "var(--text)",
            color: "#ffffff",
            padding: "10px 18px",
            borderRadius: "var(--r-md)",
            fontSize: "13px",
            fontWeight: "600",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* LEFT COLUMN: CONVERSATION LIST */}
      <div
        style={{
          borderRight: "1px solid var(--border-light)",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--surface)",
        }}
      >
        {/* Header with Search & Filter */}
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid var(--border-light)",
            backgroundColor: "var(--surface)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <MessageCircle size={20} color="var(--primary)" />
              <strong style={{ fontSize: "16px", color: "var(--text)" }}>Chat Khách Hàng</strong>
            </div>
            {totalUnreadCount > 0 && (
              <span
                style={{
                  backgroundColor: "var(--primary)",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: "800",
                  padding: "2px 8px",
                  borderRadius: "10px",
                }}
              >
                {totalUnreadCount} chưa đọc
              </span>
            )}
          </div>

          {/* Search Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              backgroundColor: "var(--surface-muted)",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--border)",
              marginBottom: "10px",
            }}
          >
            <Search size={16} color="var(--text-tertiary)" />
            <input
              type="text"
              placeholder="Tìm kiếm khách hàng hoặc tin nhắn..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: "13px",
                color: "var(--text)",
                width: "100%",
                outline: "none",
              }}
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword("")}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setFilterType("ALL")}
              style={{
                flex: 1,
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "700",
                border: filterType === "ALL" ? "1px solid var(--primary)" : "1px solid var(--border)",
                backgroundColor: filterType === "ALL" ? "var(--primary-light)" : "transparent",
                color: filterType === "ALL" ? "var(--primary)" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              Tất cả ({conversations.length})
            </button>
            <button
              onClick={() => setFilterType("UNREAD")}
              style={{
                flex: 1,
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "700",
                border: filterType === "UNREAD" ? "1px solid var(--primary)" : "1px solid var(--border)",
                backgroundColor: filterType === "UNREAD" ? "var(--primary-light)" : "transparent",
                color: filterType === "UNREAD" ? "var(--primary)" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              Chưa đọc ({totalUnreadCount})
            </button>
          </div>
        </div>

        {/* Conversation List Items */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loadingList && conversations.length === 0 && (
            <div style={{ padding: "30px 16px", textAlign: "center", color: "var(--text-secondary)" }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px", color: "var(--primary)" }} />
              <div style={{ fontSize: "13px" }}>Đang tải danh sách hội thoại...</div>
            </div>
          )}

          {!loadingList && filteredConversations.length === 0 && (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "var(--text-secondary)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <MessageCircle size={36} color="var(--border)" style={{ marginBottom: "10px" }} />
              <strong style={{ fontSize: "14px", color: "var(--text)", marginBottom: "4px" }}>
                {searchKeyword ? "Không tìm thấy khách hàng" : "Chưa có cuộc trò chuyện nào"}
              </strong>
              <span style={{ fontSize: "12px" }}>
                {searchKeyword ? "Thử tìm kiếm với từ khóa khác" : "Khi người mua nhắn tin với shop, tin nhắn sẽ xuất hiện tại đây."}
              </span>
            </div>
          )}

          {filteredConversations.map((conv) => {
            const isSelected = activeConv?.id === conv.id;
            const unread = conv.unreadCountForShop || 0;
            const buyerName = conv.buyerName || conv.userName || conv.buyerId || "Khách Hàng";

            return (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--border-light)",
                  backgroundColor: isSelected
                    ? "var(--primary-subtle)"
                    : unread > 0
                    ? "#fff7ed"
                    : "var(--surface)",
                  cursor: "pointer",
                  transition: "background-color 0.15s",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "var(--surface-muted)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = unread > 0 ? "#fff7ed" : "var(--surface)";
                  }
                }}
              >
                {/* Active selection bar indicator */}
                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: "4px",
                      backgroundColor: "var(--primary)",
                    }}
                  />
                )}

                {/* Avatar with Online indicator */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      backgroundColor: "var(--primary-light)",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "800",
                      fontSize: "15px",
                    }}
                  >
                    {conv.buyerAvatar ? (
                      <img
                        src={conv.buyerAvatar}
                        alt={buyerName}
                        style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      getInitials(buyerName)
                    )}
                  </div>
                  <span
                    style={{
                      position: "absolute",
                      bottom: "1px",
                      right: "1px",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: conv.isOnline !== false ? "#10b981" : "#9ca3af",
                      border: "2px solid #ffffff",
                    }}
                  />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "3px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: unread > 0 ? "800" : "600",
                        color: "var(--text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {buyerName}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)", flexShrink: 0 }}>
                      {conv.lastMessageAt
                        ? new Date(conv.lastMessageAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : conv.lastTime || ""}
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
                    {conv.lastMessage || "Đã kết nối cuộc trò chuyện"}
                  </div>
                </div>

                {/* Unread badge */}
                {unread > 0 && (
                  <span
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "#ffffff",
                      borderRadius: "10px",
                      padding: "2px 7px",
                      fontSize: "11px",
                      fontWeight: "800",
                      flexShrink: 0,
                    }}
                  >
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: ACTIVE CONVERSATION */}
      {activeConv ? (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "var(--surface)" }}>
          {/* Header */}
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--border-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "var(--surface)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary-light)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "15px",
                }}
              >
                {getInitials(activeConv.buyerName || activeConv.userName || "Khách Hàng")}
              </div>
              <div>
                <div style={{ fontWeight: "700", fontSize: "15px", color: "var(--text)" }}>
                  {activeConv.buyerName || activeConv.userName || "Khách Hàng"}
                </div>
                <div style={{ fontSize: "12px", color: "#10b981", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                  <span>Trực tuyến • Khách hàng tiềm năng</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={() => loadMessages(activeConv.id)}
                title="Làm mới tin nhắn"
                style={{
                  padding: "7px 10px",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--surface)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                <RefreshCw size={14} />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          {/* Messages Feed Area */}
          <div
            style={{
              flex: 1,
              padding: "20px",
              overflowY: "auto",
              backgroundColor: "var(--bg)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {loadingMsg && messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px", color: "var(--primary)" }} />
                <span style={{ fontSize: "13px" }}>Đang tải tin nhắn...</span>
              </div>
            )}

            {messages.length === 0 && !loadingMsg && (
              <div
                style={{
                  margin: "auto",
                  textAlign: "center",
                  padding: "30px",
                  backgroundColor: "var(--surface)",
                  borderRadius: "12px",
                  border: "1px dashed var(--border)",
                  maxWidth: "400px",
                }}
              >
                <Sparkles size={32} color="var(--primary)" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontWeight: "700", fontSize: "14px", color: "var(--text)", marginBottom: "4px" }}>
                  Bắt đầu tư vấn khách hàng
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  Hãy gửi lời chào hoặc trả lời câu hỏi của khách hàng để gia tăng tỷ lệ chốt đơn!
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const isShop =
                msg.senderRole === "SHOP" ||
                msg.senderRole === "SELLER" ||
                msg.sender === "shop" ||
                msg.senderId === String(user?.userId) ||
                msg.senderId === String(shop?.ownerId);

              return (
                <div
                  key={msg.id || `m-${Math.random()}`}
                  style={{
                    alignSelf: isShop ? "flex-end" : "flex-start",
                    maxWidth: "70%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isShop ? "flex-end" : "flex-start",
                  }}
                >
                  {/* Sender Tag Header */}
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-tertiary)",
                      marginBottom: "3px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {isShop ? (
                      <>
                        <span style={{ fontWeight: "700", color: "var(--primary)" }}>Shop của bạn</span>
                        <span>•</span>
                        <span>
                          {msg.sentAt
                            ? new Date(msg.sentAt).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : msg.time || ""}
                        </span>
                      </>
                    ) : (
                      <>
                        <span style={{ fontWeight: "600" }}>{activeConv.buyerName || "Khách hàng"}</span>
                        <span>•</span>
                        <span>
                          {msg.sentAt
                            ? new Date(msg.sentAt).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : msg.time || ""}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Image Attachments */}
                  {Array.isArray(msg.imageUrls) && msg.imageUrls.length > 0 && (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "4px" }}>
                      {msg.imageUrls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={url}
                            alt="Attachment"
                            style={{
                              width: "140px",
                              height: "140px",
                              objectFit: "cover",
                              borderRadius: "8px",
                              border: "1px solid var(--border)",
                            }}
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Text Bubble */}
                  {msg.content && (
                    <div
                      style={{
                        backgroundColor: isShop ? "var(--primary)" : "var(--surface)",
                        color: isShop ? "#ffffff" : "var(--text)",
                        padding: "10px 14px",
                        borderRadius: isShop ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                        fontSize: "13px",
                        lineHeight: "1.45",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        wordBreak: "break-word",
                        border: isShop ? "none" : "1px solid var(--border-light)",
                      }}
                    >
                      {msg.content}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies Bar */}
          <div
            style={{
              padding: "8px 16px",
              backgroundColor: "var(--surface)",
              borderTop: "1px solid var(--border-light)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--primary)", fontSize: "11px", fontWeight: "700" }}>
              <Sparkles size={14} />
              <span>Trả lời nhanh:</span>
            </div>
            {QUICK_REPLIES.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => handleSendQuickReply(reply)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "14px",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--surface-muted)",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--primary-light)";
                  e.currentTarget.style.color = "var(--primary)";
                  e.currentTarget.style.borderColor = "var(--primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--surface-muted)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Image Previews bar if selecting images */}
          {imagePreviews.length > 0 && (
            <div
              style={{
                padding: "8px 16px",
                backgroundColor: "var(--surface-muted)",
                display: "flex",
                gap: "10px",
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
                      width: "60px",
                      height: "60px",
                      objectFit: "cover",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
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
                      width: "18px",
                      height: "18px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--border-light)",
              backgroundColor: "var(--surface)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              multiple
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Gửi hình ảnh sản phẩm"
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                padding: "8px",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              <ImageIcon size={20} />
            </button>

            {/* Input field */}
            <input
              type="text"
              placeholder="Nhập câu trả lời hoặc tư vấn cho khách hàng... (Nhấn Enter để gửi)"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "20px",
                border: "1px solid var(--border)",
                backgroundColor: "var(--surface-muted)",
                fontSize: "13px",
                color: "var(--text)",
                outline: "none",
              }}
            />

            {/* Send Button */}
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={sending || (!draft.trim() && pendingImages.length === 0)}
              style={{
                backgroundColor: "var(--primary)",
                color: "#ffffff",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor:
                  sending || (!draft.trim() && pendingImages.length === 0)
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  sending || (!draft.trim() && pendingImages.length === 0) ? 0.6 : 1,
                transition: "transform 0.15s",
              }}
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--bg)",
            color: "var(--text-secondary)",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <MessageCircle size={48} color="var(--border)" style={{ marginBottom: "16px" }} />
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text)", marginBottom: "6px" }}>
            Chào mừng đến với Trung Tâm Chat Người Bán
          </h3>
          <p style={{ fontSize: "13px", maxWidth: "340px", lineHeight: "1.5" }}>
            Chọn một khách hàng ở danh sách bên trái để xem lịch sử trao đổi và gửi tin nhắn tư vấn.
          </p>
        </div>
      )}
    </div>
  );
}