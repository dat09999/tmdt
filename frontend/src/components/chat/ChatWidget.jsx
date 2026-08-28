import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Store,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import { chatService } from "../../services/chatService";
import DevBadge from "../common/DevBadge";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  const loadData = async () => {
    const list = await chatService.getConversations();
    setConversations(list || []);
    if (!activeConvId && list?.length > 0) {
      setActiveConvId(list[0].id);
    }
  };

  useEffect(() => {
    loadData();
    const handleMsgReceived = () => loadData();
    window.addEventListener("chat_message_received", handleMsgReceived);
    return () => window.removeEventListener("chat_message_received", handleMsgReceived);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversations, activeConvId, isOpen]);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConvId) return;

    const text = inputMessage.trim();
    setInputMessage("");
    await chatService.sendMessage(activeConvId, text);
    await loadData();
  };

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
            onClick={() => setIsOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 18px",
              borderRadius: "99px",
              backgroundColor: "var(--primary)",
              color: "#ffffff",
              boxShadow: "0 4px 18px rgba(238, 77, 45, 0.4)",
              fontWeight: "700",
              fontSize: "14px",
              border: "2px solid #ffffff",
              transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <MessageCircle size={20} />
            <span>Chat với Người Bán</span>
            <span
              style={{
                background: "var(--accent-gold)",
                color: "#78350f",
                fontSize: "10px",
                padding: "2px 6px",
                borderRadius: "99px",
                fontWeight: "800",
              }}
            >
              Dev
            </span>
          </button>
        </div>
      )}

      {/* Chat Box Drawer / Popup */}
      {isOpen && (
        <div
          className="card"
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "380px",
            maxWidth: "calc(100vw - 32px)",
            height: "520px",
            maxHeight: "calc(100vh - 40px)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            borderRadius: "var(--r-lg)",
            border: "1px solid var(--border)",
            backgroundColor: "var(--surface)",
            overflow: "hidden",
            animation: "scaleIn 0.2s ease-out",
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              backgroundColor: "var(--primary)",
              color: "#ffffff",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--primary)",
                }}
              >
                <Store size={18} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "700", lineHeight: "1.2" }}>
                  {activeConv?.shopName || "Chat DoMix"}
                </div>
                <div style={{ fontSize: "11px", opacity: 0.9, display: "flex", alignItems: "center", gap: "4px" }}>
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: activeConv?.isOnline ? "#4ade80" : "#9ca3af",
                    }}
                  />
                  <span>{activeConv?.isOnline ? "Đang trực tuyến" : "Ngoại tuyến"}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: "4px",
                  color: "#fff",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                <Minimize2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: "4px",
                  color: "#fff",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Dev Badge Notice */}
          <div style={{ padding: "6px 12px", background: "#fffbeb", borderBottom: "1px solid #fef3c7" }}>
            <DevBadge text="Tính năng Chat đang phát triển (Mô phỏng tin nhắn)" />
          </div>

          {/* Messages Area */}
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
            {(activeConv?.messages || []).map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isUser ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: isUser ? "var(--primary)" : "var(--surface)",
                      color: isUser ? "#ffffff" : "var(--text)",
                      padding: "9px 13px",
                      borderRadius: isUser
                        ? "14px 14px 2px 14px"
                        : "14px 14px 14px 2px",
                      fontSize: "13px",
                      lineHeight: "1.4",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      wordBreak: "break-word",
                    }}
                  >
                    {msg.text}
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "var(--text-tertiary)",
                      marginTop: "3px",
                    }}
                  >
                    {msg.time}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick shop suggestions */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              padding: "6px 12px",
              overflowX: "auto",
              backgroundColor: "var(--surface)",
              borderTop: "1px solid var(--border-light)",
            }}
          >
            {["Shop còn hàng không?", "Bao lâu thì nhận được hàng?", "Có mã giảm giá không shop?"].map(
              (prompt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInputMessage(prompt);
                  }}
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    backgroundColor: "var(--surface-muted)",
                    padding: "4px 8px",
                    borderRadius: "99px",
                    border: "1px solid var(--border)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {prompt}
                </button>
              )
            )}
          </div>

          {/* Message Input Bar */}
          <form
            onSubmit={handleSendMessage}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 12px",
              backgroundColor: "var(--surface)",
              borderTop: "1px solid var(--border-light)",
              gap: "8px",
            }}
          >
            <input
              type="text"
              placeholder="Nhập nội dung tin nhắn..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              style={{
                flex: 1,
                border: "1px solid var(--border)",
                borderRadius: "var(--r-sm)",
                padding: "8px 12px",
                fontSize: "13px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "var(--r-sm)",
                backgroundColor: inputMessage.trim() ? "var(--primary)" : "var(--surface-muted)",
                color: inputMessage.trim() ? "#ffffff" : "var(--text-tertiary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: inputMessage.trim() ? "pointer" : "not-allowed",
                transition: "all 0.15s",
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
