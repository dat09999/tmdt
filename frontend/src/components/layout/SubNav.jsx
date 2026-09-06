import React from "react";
import { Flame, Tag, Truck, ShieldCheck, Zap } from "lucide-react";
import { useAuth } from "../../pages/Authcontext";

export default function SubNav({ activeTab = "" }) {
  const { user } = useAuth();

  const links = [
    { label: "Trang Chủ", href: "/", icon: "🏠" },
    { label: "Flash Sale", href: "/#flash-sale", icon: "🔥", badge: "HOT" },
    { label: "Tất Cả Sản Phẩm", href: "/products", icon: "🛍️" },
    { label: "Đơn Mua", href: "/orders", icon: "📦" },
    { label: "Mã Giảm Giá", href: "/profile#vouchers", icon: "🎟️" },
    { label: "Yêu Thích", href: "/wishlist", icon: "❤️" },
    { label: "Kênh Người Bán", href: "/seller", icon: "🏪" },
    ...(user?.role === "ADMIN"
      ? [{ label: "Trang Quản Trị", href: "/admin", icon: "🛡️", badge: "ADMIN" }]
      : []),
  ];

  return (
    <nav
      style={{
        backgroundColor: "var(--surface)",
        borderBottom: "1px solid var(--border-light)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          minHeight: "42px",
        }}
      >
        {links.map((link, idx) => (
          <a
            key={idx}
            href={link.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 14px",
              fontSize: "13px",
              fontWeight: "600",
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
              borderBottom: "2px solid transparent",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--primary)";
              e.currentTarget.style.borderBottomColor = "var(--primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.borderBottomColor = "transparent";
            }}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
            {link.badge && (
              <span
                style={{
                  backgroundColor: "var(--primary)",
                  color: "#fff",
                  fontSize: "9px",
                  fontWeight: "800",
                  padding: "1px 5px",
                  borderRadius: "99px",
                }}
              >
                {link.badge}
              </span>
            )}
          </a>
        ))}
      </div>
    </nav>
  );
}
