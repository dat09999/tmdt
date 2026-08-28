import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  ShoppingCart,
  Heart,
  Store,
  User as UserIcon,
  LogOut,
  Package,
  RotateCcw,
  Bell,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../pages/Authcontext";
import { cartService } from "../../services/cartService";

export default function Header({ onSearch, initialSearch = "" }) {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [cartCount, setCartCount] = useState(0);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  // Load cart count
  useEffect(() => {
    cartService
      .getCart(user?.userId)
      .then((cart) => {
        const totalItems = (cart?.items || []).reduce(
          (sum, item) => sum + (item.quantity || 1),
          0
        );
        setCartCount(totalItems);
      })
      .catch(() => setCartCount(0));
  }, [user?.userId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    } else {
      window.location.href = `/products?search=${encodeURIComponent(searchTerm.trim())}`;
    }
  };

  const handleLogout = async () => {
    setShowUserDropdown(false);
    await logout();
    window.location.href = "/login";
  };

  const displayName =
    user?.fullName || user?.name || user?.email?.split("@")[0] || "Tài khoản";

  return (
    <header
      style={{
        backgroundColor: "var(--primary)",
        color: "#ffffff",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 2px 10px rgba(238, 77, 45, 0.25)",
      }}
    >
      {/* Top micro bar for quick links */}
      <div
        className="hide-mobile"
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
          padding: "4px 0",
          fontSize: "12px",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <a
              href="/seller"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                color: "#fff",
                fontWeight: "500",
                opacity: 0.95,
              }}
            >
              <Store size={14} />
              <span>Kênh Người Bán</span>
            </a>
            <span style={{ opacity: 0.4 }}>|</span>
            <span style={{ opacity: 0.9 }}>Tải ứng dụng DoMix</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span style={{ opacity: 0.9 }}>Kết nối: 📱 Facebook 📷 Instagram</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <a
              href="/notifications"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                color: "#fff",
                opacity: 0.95,
              }}
            >
              <Bell size={14} />
              <span>Thông Báo</span>
            </a>
            <a href="/refunds" style={{ color: "#fff", opacity: 0.95 }}>
              Đổi trả & Hoàn tiền
            </a>
            <a href="#" style={{ color: "#fff", opacity: 0.95 }}>
              Trợ giúp
            </a>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div style={{ padding: "12px 0" }}>
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          {/* Logo */}
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "#fff",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "900",
                fontSize: "22px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              🛒
            </div>
            <div>
              <span
                style={{
                  fontSize: "24px",
                  fontWeight: "900",
                  letterSpacing: "-0.5px",
                  color: "#fff",
                  lineHeight: "1.1",
                }}
              >
                DoMix
              </span>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: "600",
                  opacity: 0.9,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Mall & Siêu Sale
              </div>
            </div>
          </a>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              flex: 1,
              maxWidth: "680px",
              display: "flex",
              backgroundColor: "#fff",
              borderRadius: "var(--r-sm)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              overflow: "hidden",
              padding: "3px",
            }}
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Săn iPhone 15, thời trang thu đông, đồ gia dụng giảm 50%..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                padding: "8px 14px",
                fontSize: "14px",
                color: "var(--text)",
                background: "transparent",
              }}
            />
            <button
              type="submit"
              style={{
                background: "var(--primary)",
                color: "#fff",
                padding: "0 22px",
                borderRadius: "var(--r-xs)",
                fontWeight: "700",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "background 0.15s",
              }}
            >
              <Search size={16} />
              <span className="hide-mobile">Tìm kiếm</span>
            </button>
          </form>

          {/* Header Action Icons */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
            {/* Wishlist */}
            <a
              href="/wishlist"
              className="hide-mobile"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                color: "#fff",
                padding: "6px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: "600",
                transition: "background 0.15s",
              }}
            >
              <Heart size={22} />
              <span>Yêu thích</span>
            </a>

            {/* Cart Button */}
            <a
              href="/cart"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#fff",
                position: "relative",
                padding: "6px 12px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                fontWeight: "700",
                fontSize: "13px",
              }}
            >
              <div style={{ position: "relative" }}>
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-10px",
                      backgroundColor: "var(--accent-gold)",
                      color: "#b45309",
                      fontSize: "11px",
                      fontWeight: "800",
                      padding: "1px 6px",
                      borderRadius: "99px",
                      border: "2px solid var(--primary)",
                    }}
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>
              <span className="hide-mobile">Giỏ hàng</span>
            </a>

            {/* User Account / Login Button */}
            {user?.userId ? (
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#fff",
                    background: "rgba(0,0,0,0.12)",
                    padding: "6px 12px",
                    borderRadius: "99px",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      background: "#fff",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "800",
                      fontSize: "13px",
                    }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span
                    style={{
                      maxWidth: "110px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {displayName}
                  </span>
                  <ChevronDown size={14} />
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      width: "240px",
                      backgroundColor: "#fff",
                      borderRadius: "var(--r-md)",
                      boxShadow: "var(--shadow-lg)",
                      border: "1px solid var(--border)",
                      padding: "8px 0",
                      zIndex: 2000,
                      color: "var(--text)",
                      animation: "scaleIn 0.15s ease-out",
                    }}
                  >
                    <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-light)" }}>
                      <div style={{ fontWeight: "700", fontSize: "14px" }}>{displayName}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        {user?.email || "Thành viên DoMix"}
                      </div>
                    </div>

                    <a
                      href="/profile"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 16px",
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "var(--text)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-muted)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <UserIcon size={16} />
                      <span>Tài khoản của tôi</span>
                    </a>

                    <a
                      href="/orders"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 16px",
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "var(--text)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-muted)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <Package size={16} />
                      <span>Đơn mua của tôi</span>
                    </a>

                    <a
                      href="/refunds"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 16px",
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "var(--text)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-muted)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <RotateCcw size={16} />
                      <span>Trả hàng & Hoàn tiền</span>
                    </a>

                    <div style={{ height: "1px", background: "var(--border-light)", margin: "6px 0" }} />

                    <button
                      onClick={handleLogout}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 16px",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "var(--error)",
                        textAlign: "left",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--error-bg)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <LogOut size={16} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <a
                  href="/login"
                  style={{
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: "13px",
                    padding: "6px 14px",
                    borderRadius: "var(--r-sm)",
                    background: "rgba(255,255,255,0.2)",
                  }}
                >
                  Đăng nhập
                </a>
                <a
                  href="/register"
                  className="hide-mobile"
                  style={{
                    color: "var(--primary)",
                    background: "#fff",
                    fontWeight: "700",
                    fontSize: "13px",
                    padding: "6px 14px",
                    borderRadius: "var(--r-sm)",
                  }}
                >
                  Đăng ký
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
