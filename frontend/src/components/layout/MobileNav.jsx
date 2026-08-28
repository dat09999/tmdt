import React, { useState, useEffect } from "react";
import { Home, Grid, Bell, ShoppingCart, User, Heart } from "lucide-react";
import { useAuth } from "../../pages/Authcontext";
import { cartService } from "../../services/cartService";

export default function MobileNav() {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const currentPath = window.location.pathname;

  useEffect(() => {
    cartService
      .getCart(user?.userId)
      .then((cart) => {
        const count = (cart?.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0);
        setCartCount(count);
      })
      .catch(() => setCartCount(0));
  }, [user?.userId]);

  const navItems = [
    { label: "Trang chủ", href: "/", icon: Home, active: currentPath === "/" || currentPath === "/home" },
    { label: "Danh mục", href: "/products", icon: Grid, active: currentPath.startsWith("/products") },
    { label: "Yêu thích", href: "/wishlist", icon: Heart, active: currentPath === "/wishlist" },
    { label: "Thông báo", href: "/notifications", icon: Bell, active: currentPath === "/notifications" },
    {
      label: "Giỏ hàng",
      href: "/cart",
      icon: ShoppingCart,
      active: currentPath === "/cart",
      badge: cartCount > 0 ? cartCount : null,
    },
    {
      label: user?.userId ? "Tôi" : "Đăng nhập",
      href: user?.userId ? "/profile" : "/login",
      icon: User,
      active: currentPath === "/profile" || currentPath === "/login",
    },
  ];

  return (
    <nav
      className="show-mobile"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "var(--bottomnav-h)",
        backgroundColor: "var(--surface)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 1000,
        boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
      }}
    >
      {navItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <a
            key={idx}
            href={item.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "2px",
              flex: 1,
              height: "100%",
              color: item.active ? "var(--primary)" : "var(--text-secondary)",
              position: "relative",
              fontSize: "11px",
              fontWeight: item.active ? "700" : "500",
            }}
          >
            <div style={{ position: "relative" }}>
              <Icon size={20} strokeWidth={item.active ? 2.5 : 1.8} />
              {item.badge && (
                <span
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-8px",
                    backgroundColor: "var(--primary)",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: "800",
                    padding: "0 5px",
                    borderRadius: "99px",
                    border: "1px solid #fff",
                  }}
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </div>
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
