import { useEffect, useRef, useState } from "react";
import { useAuth } from "../pages/Authcontext";
import { API_BASE_URL, authFetch } from "../utils/auth";

export default function Header({ children }) {
  const { user, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!user?.userId) return;
    authFetch(`${API_BASE_URL}/cart/${user.userId}`)
      .then((data) => setCartCount(Array.isArray(data?.items) ? data.items.length : 0))
      .catch(() => setCartCount(0));
  }, [user?.userId]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setShowMenu(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const displayName =
    user?.fullName || user?.name || user?.email?.split("@")[0] || "Tài khoản";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    setShowMenu(false);
    await logout();
    window.location.href = "/login";
  };

  return (
    <>
      <header className="topbar">
        <a href="/" className="topbar-brand">
          <span className="topbar-brand-name">🛒 DoMix</span>
        </a>

        {children}

        <div className="topbar-right">
          <button
            className="topbar-icon-btn"
            onClick={() => (window.location.href = "/wishlist")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="hide-sm">Yêu thích</span>
          </button>

          <button
            className="topbar-icon-btn"
            onClick={() => (window.location.href = "/cart")}
            style={{ position: "relative" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
            <span className="hide-sm">Giỏ hàng</span>
          </button>

          <button
            className="topbar-icon-btn"
            onClick={() => (window.location.href = "/seller")}
            title="Kênh người bán"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9h18l-1.5-5H4.5L3 9Z" />
              <path d="M5 9v10h14V9M9 19v-6h6v6" />
            </svg>
            <span className="hide-sm">Bán hàng</span>
          </button>

          <div className="user-menu" ref={menuRef}>
            <button
              type="button"
              className="topbar-user-btn"
              aria-haspopup="menu"
              aria-expanded={showMenu}
              onClick={() => setShowMenu((current) => !current)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              <span className="user-menu-name">{displayName}</span>
            </button>

            {showMenu && (
              <div className="user-menu-dropdown" role="menu">
                <div className="user-menu-summary">
                  <span className="user-menu-avatar" aria-hidden="true">
                    {avatarLetter}
                  </span>
                  <div className="user-menu-account">
                    <strong>{displayName}</strong>
                    {user?.email && <span>{user.email}</span>}
                  </div>
                </div>

                <div className="user-menu-divider" />

                <button
                  type="button"
                  className="user-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setShowMenu(false);
                    window.location.href = "/profile";
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
                  </svg>
                  Thông tin cá nhân
                </button>

                <button
                  type="button"
                  className="user-menu-item logout"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M10 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5" />
                    <path d="m15 16 4-4-4-4M19 12H9" />
                  </svg>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="subnav">
        <button className="subnav-link" onClick={() => (window.location.href = "/")}>
          🏠 Trang chủ
        </button>
        <button className="subnav-link" onClick={() => (window.location.href = "/orders")}>
          📦 Đơn hàng
        </button>
        <button className="subnav-link" onClick={() => (window.location.href = "/wishlist")}>
          ❤️ Yêu thích
        </button>
        <button className="subnav-link" onClick={() => (window.location.href = "/notifications")}>
          🔔 Thông báo
        </button>
      </nav>
    </>
  );
}
