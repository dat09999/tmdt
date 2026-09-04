import React, { useState, useEffect, useRef, useCallback, Component } from "react";
import {
  MessageCircle,
  Search,
  Send,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  X,
  Loader2,
  AlertCircle,
  ArrowDown,
} from "lucide-react";
import { chatService } from "../../services/chatService";
import { useAuth } from "../../pages/Authcontext";

// Error Boundary bảo vệ: Không bao giờ bị màn hình trắng kể cả khi dữ liệu có lỗi
class SellerChatCenterErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[SellerChatCenter] Lỗi hiển thị giao diện:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #fee2e2",
            margin: "16px 0",
          }}
        >
          <AlertCircle size={44} color="#ef4444" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#111827", marginBottom: "6px" }}>
            Đã xảy ra sự cố khi tải trung tâm chat
          </h3>
          <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>
            {this.state.error?.message || "Vui lòng tải lại hoặc thử lại sau."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: "8px 18px",
              backgroundColor: "#ee4d2d",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "700",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Thử tải lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const QUICK_REPLIES = [
  "Dạ chào bạn, sản phẩm bên shop vẫn còn sẵn hàng ạ! 🥰",
  "Đơn hàng của bạn đã được đóng gói và chuẩn bị giao cho bên vận chuyển ạ 📦",
  "Cảm ơn bạn đã tin tưởng ủng hộ shop! Chúc bạn một ngày tốt lành ❤️",
  "Sản phẩm được bảo hành chính hãng và hỗ trợ đổi trả miễn phí trong 7 ngày ạ ✨",
  "Dạ bạn cho shop xin thêm thông tin/hình ảnh để shop hỗ trợ ngay nhé!",
];

const getInitials = (name) => {
  if (!name) return "KH";
  const str = typeof name === "string" ? name.trim() : String(name || "KH").trim();
  if (!str) return "KH";
  const parts = str.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "KH";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatTime = (timeVal) => {
  if (!timeVal) return "";
  try {
    const d = new Date(timeVal);
    if (isNaN(d.getTime())) return String(timeVal);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const timeStr = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    if (isToday) return timeStr;
    return `${d.getDate()}/${d.getMonth() + 1} ${timeStr}`;
  } catch {
    return String(timeVal || "");
  }
};

function SellerChatCenterInner({ shop, initialSelectedConvId = null }) {
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
  const [refreshing, setRefreshing] = useState(false);
  const [draft, setDraft] = useState("");
  const [pendingImages, setPendingImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [toastMessage, setToastMessage] = useState("");
  const [hasNewUnseenMessage, setHasNewUnseenMessage] = useState(false);

  const activeConvRef = useRef(null);
  activeConvRef.current = activeConv;

  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const shouldForceScrollBottomRef = useRef(false);
  const isNewMessageReceivedRef = useRef(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Cuộn đáy trực tiếp trên element của khung tin nhắn — Tuyệt đối không làm giật cuộn trang web
  const scrollToContainerBottom = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    try {
      el.scrollTop = el.scrollHeight;
    } catch {}
  }, []);

  // 1. Hàm chọn hội thoại (Được định nghĩa TRƯỚC để loadConversations có thể gọi an toàn)
  const handleSelectConversation = useCallback(async (conv) => {
    if (!conv) return;
    setActiveConv(conv);
    setDraft("");
    setPendingImages([]);
    setImagePreviews([]);
    setHasNewUnseenMessage(false);
    shouldForceScrollBottomRef.current = true;
    isNearBottomRef.current = true;

    try {
      await chatService.markAsRead(conv.id);
    } catch {}

    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unreadCountForShop: 0 } : c))
    );
  }, []);

  // 2. Tải danh sách hội thoại của Shop
  const loadConversations = useCallback(
    async (silent = false) => {
      if (!shopId) return;
      if (!silent) setLoadingList(true);
      try {
        const list = await chatService.getShopConversations(shopId);
        const safeList = Array.isArray(list) ? list : [];
        setConversations(safeList);

        // Tự động chọn cuộc trò chuyện nếu chưa chọn cuộc nào
        if (!activeConvRef.current && safeList.length > 0) {
          let target = safeList[0];
          if (initialSelectedConvId) {
            const match = safeList.find((c) => c.id === initialSelectedConvId);
            if (match) target = match;
          }
          handleSelectConversation(target);
        }
      } catch (err) {
        console.error("Load shop conversations failed:", err);
      } finally {
        if (!silent) setLoadingList(false);
      }
    },
    [shopId, initialSelectedConvId, handleSelectConversation]
  );

  useEffect(() => {
    loadConversations();
    const interval = setInterval(() => {
      loadConversations(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  // 3. Tải tin nhắn của hội thoại đang chọn
  const loadMessages = useCallback(async (convId, silent = false) => {
    if (!convId) return;
    if (!silent) setLoadingMsg(true);
    try {
      const msgList = await chatService.getMessages(convId);
      const safeList = Array.isArray(msgList) ? msgList : [];

      setMessages((prev) => {
        // Nếu số lượng và id tin nhắn cuối cùng không đổi, giữ nguyên reference tránh re-render
        if (
          prev.length === safeList.length &&
          prev.length > 0 &&
          prev[prev.length - 1]?.id === safeList[safeList.length - 1]?.id
        ) {
          return prev;
        }

        // Có tin nhắn mới từ khách
        if (safeList.length > prev.length) {
          isNewMessageReceivedRef.current = true;
          if (!isNearBottomRef.current) {
            setHasNewUnseenMessage(true);
          }
        }

        return safeList;
      });
    } catch (err) {
      console.error("Load messages failed:", err);
    } finally {
      if (!silent) setLoadingMsg(false);
    }
  }, []);

  // Polling định kỳ tin nhắn của hội thoại hiện tại
  useEffect(() => {
    if (!activeConv?.id) return;
    setHasNewUnseenMessage(false);
    shouldForceScrollBottomRef.current = true;
    isNearBottomRef.current = true;

    loadMessages(activeConv.id, false);
    const interval = setInterval(() => {
      loadMessages(activeConv.id, true);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeConv?.id, loadMessages]);

  // Kiểm soát cuộn: Lắng nghe sự kiện scroll của khung chat
  const handleFeedScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isAtBottom = distanceToBottom <= 80;
    isNearBottomRef.current = isAtBottom;

    if (isAtBottom && hasNewUnseenMessage) {
      setHasNewUnseenMessage(false);
    }
  };

  // Cuộn thông minh CHỈ TRONG KHUNG TIN NHẮN (không chạm tới window)
  useEffect(() => {
    if (messages.length === 0) return;

    if (shouldForceScrollBottomRef.current) {
      requestAnimationFrame(() => {
        scrollToContainerBottom();
      });
      shouldForceScrollBottomRef.current = false;
      isNewMessageReceivedRef.current = false;
    } else if (isNearBottomRef.current && isNewMessageReceivedRef.current) {
      scrollToContainerBottom();
      isNewMessageReceivedRef.current = false;
    }
  }, [messages, scrollToContainerBottom]);

  const scrollToBottomExplicit = () => {
    scrollToContainerBottom();
    isNearBottomRef.current = true;
    setHasNewUnseenMessage(false);
  };

  // Làm mới tin nhắn thủ công
  const handleRefreshMessages = async () => {
    if (!activeConv?.id || refreshing) return;
    setRefreshing(true);
    await loadMessages(activeConv.id, false);
    await loadConversations(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  // Chọn ảnh đính kèm
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

  // Gửi tin nhắn
  const handleSendMessage = async (customText = null) => {
    const textToSend = customText !== null ? customText : draft;
    if ((!textToSend || !textToSend.trim()) && pendingImages.length === 0) {
      return;
    }
    if (!activeConv?.id) return;

    try {
      setSending(true);
      const currentSenderId = user?.userId || shop?.ownerId || "seller";
      const imagesToSend = [...pendingImages];

      setDraft("");
      setPendingImages([]);
      setImagePreviews([]);
      shouldForceScrollBottomRef.current = true;
      isNearBottomRef.current = true;

      const sentMsg = await chatService.sendMessage(
        activeConv.id,
        textToSend.trim(),
        currentSenderId,
        "SHOP",
        imagesToSend
      );

      if (sentMsg) {
        setMessages((prev) => [...prev, sentMsg]);
      }

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

  // Danh sách đã lọc (Phòng vệ dữ liệu an toàn, không bao giờ crash)
  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const searchLower = String(searchKeyword || "").trim().toLowerCase();

  const filteredConversations = safeConversations.filter((c) => {
    const buyerDisplayName = String(c.buyerName || c.userName || c.userId || "Khách Hàng").toLowerCase();
    const lastMsg = typeof c.lastMessage === "string" ? c.lastMessage.toLowerCase() : "";

    const matchesSearch =
      !searchLower ||
      buyerDisplayName.includes(searchLower) ||
      lastMsg.includes(searchLower);

    if (!matchesSearch) return false;
    if (filterType === "UNREAD") {
      return (Number(c.unreadCountForShop) || 0) > 0;
    }
    return true;
  });

  const totalUnreadCount = safeConversations.reduce(
    (sum, c) => sum + (Number(c.unreadCountForShop) || 0),
    0
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "720px",
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
        boxSizing: "border-box",
        width: "100%",
        position: "relative",
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "absolute",
            top: "16px",
            right: "20px",
            zIndex: 9999,
            backgroundColor: "#1f2937",
            color: "#ffffff",
            padding: "9px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "600",
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CỘT BÊN TRÁI: DANH SÁCH HỘI THOẠI KHÁCH HÀNG (CỐ ĐỊNH 330px, KHÔNG MẤT) */}
      {/* ========================================================================= */}
      <div
        style={{
          width: "330px",
          minWidth: "320px",
          maxWidth: "340px",
          flexShrink: 0,
          borderRight: "1px solid #edf2f7",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          backgroundColor: "#ffffff",
          overflow: "hidden",
        }}
      >
        {/* Header danh sách */}
        <div
          style={{
            padding: "16px 16px 12px",
            borderBottom: "1px solid #edf2f7",
            backgroundColor: "#ffffff",
            flexShrink: 0,
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
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "#fff5f1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ee4d2d",
                }}
              >
                <MessageCircle size={18} />
              </div>
              <strong style={{ fontSize: "16px", color: "#111827", fontWeight: "800" }}>
                Tin Nhắn Khách
              </strong>
            </div>

            {totalUnreadCount > 0 && (
              <span
                style={{
                  backgroundColor: "#ee4d2d",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: "800",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  boxShadow: "0 2px 6px rgba(238, 77, 45, 0.3)",
                }}
              >
                {totalUnreadCount} mới
              </span>
            )}
          </div>

          {/* Thanh tìm kiếm */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 12px",
              backgroundColor: "#f3f4f6",
              borderRadius: "10px",
              border: "1px solid transparent",
              marginBottom: "10px",
            }}
          >
            <Search size={15} color="#9ca3af" />
            <input
              type="text"
              placeholder="Tìm khách hàng, tin nhắn..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                fontSize: "13px",
                color: "#1f2937",
                width: "100%",
                outline: "none",
              }}
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword("")}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Bộ lọc Tất cả / Chưa đọc */}
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => setFilterType("ALL")}
              style={{
                flex: 1,
                padding: "6px 8px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                border: filterType === "ALL" ? "1px solid #ee4d2d" : "1px solid #e5e7eb",
                backgroundColor: filterType === "ALL" ? "#fff5f1" : "#ffffff",
                color: filterType === "ALL" ? "#ee4d2d" : "#4b5563",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              Tất cả ({safeConversations.length})
            </button>
            <button
              onClick={() => setFilterType("UNREAD")}
              style={{
                flex: 1,
                padding: "6px 8px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                border: filterType === "UNREAD" ? "1px solid #ee4d2d" : "1px solid #e5e7eb",
                backgroundColor: filterType === "UNREAD" ? "#fff5f1" : "#ffffff",
                color: filterType === "UNREAD" ? "#ee4d2d" : "#4b5563",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              Chưa đọc ({totalUnreadCount})
            </button>
          </div>
        </div>

        {/* Danh sách các cuộc trò chuyện (cuộn độc lập) */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {loadingList && safeConversations.length === 0 && (
            <div style={{ padding: "40px 16px", textAlign: "center", color: "#6b7280" }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px", color: "#ee4d2d" }} />
              <div style={{ fontSize: "13px" }}>Đang tải danh sách hội thoại...</div>
            </div>
          )}

          {!loadingList && filteredConversations.length === 0 && (
            <div
              style={{
                padding: "48px 20px",
                textAlign: "center",
                color: "#6b7280",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <MessageCircle size={40} color="#d1d5db" style={{ marginBottom: "12px" }} />
              <strong style={{ fontSize: "14px", color: "#374151", marginBottom: "4px" }}>
                {searchKeyword ? "Không tìm thấy khách hàng" : "Chưa có cuộc trò chuyện"}
              </strong>
              <span style={{ fontSize: "12px", color: "#9ca3af", maxWidth: "220px", lineHeight: "1.4" }}>
                {searchKeyword
                  ? "Thử tìm kiếm với từ khóa khác"
                  : "Tin nhắn từ người mua sẽ hiển thị tại danh sách này."}
              </span>
            </div>
          )}

          {filteredConversations.map((conv) => {
            const isSelected = activeConv?.id === conv.id;
            const unread = Number(conv.unreadCountForShop) || 0;
            const buyerDisplayName = String(
              conv.buyerName || conv.userName || (conv.userId ? `Khách #${String(conv.userId).slice(-4)}` : "Khách Hàng")
            );

            return (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 14px",
                  borderBottom: "1px solid #f3f4f6",
                  backgroundColor: isSelected ? "#fff5f1" : unread > 0 ? "#fefce8" : "#ffffff",
                  cursor: "pointer",
                  transition: "background-color 0.15s",
                  position: "relative",
                  borderLeft: isSelected ? "4px solid #ee4d2d" : "4px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = unread > 0 ? "#fefce8" : "#ffffff";
                  }
                }}
              >
                {/* Avatar tròn với chấm online */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      background: isSelected
                        ? "linear-gradient(135deg, #ff7a00, #ee4d2d)"
                        : "linear-gradient(135deg, #e5e7eb, #d1d5db)",
                      color: isSelected ? "#ffffff" : "#4b5563",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "800",
                      fontSize: "14px",
                      boxShadow: isSelected ? "0 2px 8px rgba(238, 77, 45, 0.25)" : "none",
                    }}
                  >
                    {conv.buyerAvatar ? (
                      <img
                        src={conv.buyerAvatar}
                        alt={buyerDisplayName}
                        style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      getInitials(buyerDisplayName)
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

                {/* Thông tin tin nhắn */}
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
                        fontSize: "13.5px",
                        fontWeight: unread > 0 || isSelected ? "700" : "600",
                        color: isSelected ? "#ee4d2d" : "#111827",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {buyerDisplayName}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: unread > 0 ? "#ee4d2d" : "#9ca3af",
                        fontWeight: unread > 0 ? "700" : "400",
                        flexShrink: 0,
                      }}
                    >
                      {formatTime(conv.lastMessageAt || conv.lastTime)}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: unread > 0 ? "#111827" : "#6b7280",
                      fontWeight: unread > 0 ? "600" : "400",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {String(conv.lastMessage || "Đã kết nối cuộc trò chuyện")}
                  </div>
                </div>

                {/* Badge chưa đọc */}
                {unread > 0 && (
                  <span
                    style={{
                      backgroundColor: "#ee4d2d",
                      color: "#ffffff",
                      borderRadius: "10px",
                      padding: "2px 7px",
                      fontSize: "11px",
                      fontWeight: "800",
                      flexShrink: 0,
                      boxShadow: "0 2px 5px rgba(238, 77, 45, 0.3)",
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

      {/* ========================================================================= */}
      {/* CỘT BÊN PHẢI: KHUNG CHAT CHI TIẾT (FLEX 1, CUỘN THÔNG MINH, KHÔNG TỰ GIẬT) */}
      {/* ========================================================================= */}
      {activeConv ? (
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            backgroundColor: "#f9fafb",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Header hội thoại */}
          <div
            style={{
              padding: "12px 20px",
              borderBottom: "1px solid #edf2f7",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#ffffff",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #ff7a00, #ee4d2d)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "15px",
                  boxShadow: "0 2px 8px rgba(238, 77, 45, 0.2)",
                }}
              >
                {getInitials(activeConv.buyerName || activeConv.userName || "Khách Hàng")}
              </div>
              <div>
                <div style={{ fontWeight: "700", fontSize: "15px", color: "#111827", lineHeight: "1.3" }}>
                  {String(activeConv.buyerName || activeConv.userName || (activeConv.userId ? `Khách #${String(activeConv.userId).slice(-4)}` : "Khách Hàng"))}
                </div>
                <div style={{ fontSize: "12px", color: "#10b981", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                  <span>Trực tuyến • Khách hàng</span>
                  {activeConv.userId && (
                    <span style={{ color: "#9ca3af", fontSize: "11px", marginLeft: "4px" }}>
                      (ID: #{String(activeConv.userId).slice(-6)})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={handleRefreshMessages}
                title="Tải lại tin nhắn mới nhất"
                style={{
                  padding: "7px 12px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                  color: "#4b5563",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: "600",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin text-orange-500" : ""} />
                <span>Làm mới</span>
              </button>
            </div>
          </div>

          {/* Vùng hiển thị tin nhắn (Cuộn độc lập, mượt mà) */}
          <div
            ref={messagesContainerRef}
            onScroll={handleFeedScroll}
            style={{
              flex: 1,
              padding: "20px 24px",
              overflowY: "auto",
              minHeight: 0,
              backgroundColor: "#f8fafc",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {loadingMsg && messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "50px 0", color: "#6b7280" }}>
                <Loader2 size={26} className="animate-spin" style={{ margin: "0 auto 10px", color: "#ee4d2d" }} />
                <span style={{ fontSize: "13px" }}>Đang tải nội dung trao đổi...</span>
              </div>
            )}

            {messages.length === 0 && !loadingMsg && (
              <div
                style={{
                  margin: "auto",
                  textAlign: "center",
                  padding: "36px 24px",
                  backgroundColor: "#ffffff",
                  borderRadius: "14px",
                  border: "1px dashed #e2e8f0",
                  maxWidth: "420px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                }}
              >
                <Sparkles size={32} color="#ee4d2d" style={{ margin: "0 auto 10px" }} />
                <div style={{ fontWeight: "700", fontSize: "14px", color: "#1e293b", marginBottom: "4px" }}>
                  Bắt đầu trò chuyện với khách hàng
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
                  Gửi tin nhắn chào mừng hoặc giải đáp thắc mắc để tăng tỷ lệ chốt đơn cho shop!
                </div>
              </div>
            )}

            {Array.isArray(messages) &&
              messages.map((msg, index) => {
                const isShop =
                  msg.senderRole === "SHOP" ||
                  msg.senderRole === "SELLER" ||
                  msg.sender === "shop" ||
                  (user?.userId && String(msg.senderId) === String(user.userId)) ||
                  (shop?.ownerId && String(msg.senderId) === String(shop.ownerId));

                const senderLabel = isShop ? "Shop của bạn" : String(activeConv.buyerName || activeConv.userName || "Khách hàng");
                const timeDisplay = formatTime(msg.sentAt || msg.time);
                const messageText = typeof msg.content === "string" ? msg.content : typeof msg.text === "string" ? msg.text : "";

                return (
                  <div
                    key={msg.id || `msg-${index}`}
                    style={{
                      alignSelf: isShop ? "flex-end" : "flex-start",
                      maxWidth: "72%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isShop ? "flex-end" : "flex-start",
                    }}
                  >
                    {/* Tên người gửi & Giờ */}
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#94a3b8",
                        marginBottom: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "0 4px",
                      }}
                    >
                      <span style={{ fontWeight: isShop ? "700" : "600", color: isShop ? "#ee4d2d" : "#475569" }}>
                        {senderLabel}
                      </span>
                      <span>•</span>
                      <span>{timeDisplay}</span>
                    </div>

                    {/* Ảnh đính kèm */}
                    {Array.isArray(msg.imageUrls) && msg.imageUrls.filter((u) => typeof u === "string").length > 0 && (
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                        {msg.imageUrls
                          .filter((u) => typeof u === "string")
                          .map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={url}
                                alt="Đính kèm"
                                style={{
                                  width: "160px",
                                  height: "160px",
                                  objectFit: "cover",
                                  borderRadius: "10px",
                                  border: "1px solid #e2e8f0",
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                                  transition: "transform 0.15s",
                                }}
                              />
                            </a>
                          ))}
                      </div>
                    )}

                    {/* Nội dung tin nhắn */}
                    {messageText && (
                      <div
                        style={{
                          backgroundColor: isShop ? "#ee4d2d" : "#ffffff",
                          color: isShop ? "#ffffff" : "#1e293b",
                          padding: "11px 16px",
                          borderRadius: isShop ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          fontSize: "13.5px",
                          lineHeight: "1.5",
                          boxShadow: isShop
                            ? "0 3px 10px rgba(238, 77, 45, 0.25)"
                            : "0 2px 6px rgba(0, 0, 0, 0.04)",
                          wordBreak: "break-word",
                          border: isShop ? "none" : "1px solid #e2e8f0",
                        }}
                      >
                        {messageText}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Nút nổi: Có tin nhắn mới bên dưới */}
          {hasNewUnseenMessage && (
            <button
              onClick={scrollToBottomExplicit}
              style={{
                position: "absolute",
                bottom: "130px",
                right: "24px",
                zIndex: 10,
                backgroundColor: "#1f2937",
                color: "#ffffff",
                border: "none",
                borderRadius: "20px",
                padding: "7px 14px",
                fontSize: "12px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                cursor: "pointer",
              }}
            >
              <ArrowDown size={14} />
              <span>Tin nhắn mới bên dưới</span>
            </button>
          )}

          {/* Thanh trả lời nhanh */}
          <div
            style={{
              padding: "8px 16px",
              backgroundColor: "#ffffff",
              borderTop: "1px solid #edf2f7",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              overflowX: "auto",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#ee4d2d", fontSize: "11px", fontWeight: "700" }}>
              <Sparkles size={14} />
              <span>Mẫu nhanh:</span>
            </div>
            {QUICK_REPLIES.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(reply)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "14px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#f9fafb",
                  fontSize: "11.5px",
                  fontWeight: "600",
                  color: "#4b5563",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff5f1";
                  e.currentTarget.style.color = "#ee4d2d";
                  e.currentTarget.style.borderColor = "#ee4d2d";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                  e.currentTarget.style.color = "#4b5563";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Danh sách ảnh chờ gửi */}
          {imagePreviews.length > 0 && (
            <div
              style={{
                padding: "8px 16px",
                backgroundColor: "#f3f4f6",
                display: "flex",
                gap: "10px",
                overflowX: "auto",
                borderTop: "1px solid #e5e7eb",
                flexShrink: 0,
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
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                    }}
                  />
                  <button
                    onClick={() => removePendingImage(idx)}
                    style={{
                      position: "absolute",
                      top: "-5px",
                      right: "-5px",
                      backgroundColor: "rgba(0,0,0,0.75)",
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

          {/* Khung soạn thảo tin nhắn */}
          <div
            style={{
              padding: "12px 18px",
              borderTop: "1px solid #edf2f7",
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexShrink: 0,
            }}
          >
            {/* Nút đính kèm ảnh */}
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
              title="Đính kèm hình ảnh sản phẩm"
              style={{
                backgroundColor: "#f3f4f6",
                border: "none",
                color: "#4b5563",
                padding: "9px",
                borderRadius: "10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#fff5f1";
                e.currentTarget.style.color = "#ee4d2d";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
                e.currentTarget.style.color = "#4b5563";
              }}
            >
              <ImageIcon size={19} />
            </button>

            {/* Input nhập tin */}
            <input
              type="text"
              placeholder="Nhập câu trả lời hoặc tư vấn cho khách... (Nhấn Enter để gửi)"
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
                padding: "10px 16px",
                borderRadius: "22px",
                border: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
                fontSize: "13.5px",
                color: "#111827",
                outline: "none",
                transition: "border-color 0.15s, background-color 0.15s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#ee4d2d";
                e.target.style.backgroundColor = "#ffffff";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb";
                e.target.style.backgroundColor = "#f9fafb";
              }}
            />

            {/* Nút gửi */}
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={sending || (!draft.trim() && pendingImages.length === 0)}
              style={{
                backgroundColor: "#ee4d2d",
                color: "#ffffff",
                border: "none",
                borderRadius: "50%",
                width: "42px",
                height: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor:
                  sending || (!draft.trim() && pendingImages.length === 0)
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  sending || (!draft.trim() && pendingImages.length === 0) ? 0.5 : 1,
                boxShadow:
                  sending || (!draft.trim() && pendingImages.length === 0)
                    ? "none"
                    : "0 4px 12px rgba(238, 77, 45, 0.35)",
                transition: "transform 0.15s, opacity 0.15s",
                flexShrink: 0,
              }}
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      ) : (
        /* Trạng thái chưa chọn cuộc trò chuyện */
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f9fafb",
            color: "#6b7280",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "#fff5f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              color: "#ee4d2d",
            }}
          >
            <MessageCircle size={36} />
          </div>
          <h3 style={{ fontSize: "17px", fontWeight: "800", color: "#111827", marginBottom: "6px" }}>
            Trung Tâm Chat Người Bán
          </h3>
          <p style={{ fontSize: "13px", maxWidth: "360px", lineHeight: "1.6", color: "#6b7280" }}>
            Vui lòng chọn một khách hàng ở danh sách bên trái để xem lịch sử tin nhắn và gửi hỗ trợ tư vấn.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SellerChatCenter(props) {
  return (
    <SellerChatCenterErrorBoundary>
      <SellerChatCenterInner {...props} />
    </SellerChatCenterErrorBoundary>
  );
}