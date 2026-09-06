import React from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/register";
import OAuth2SuccessPage from "./pages/OAuth2SuccessPage";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/HomePage";
import ProductListPage from "./pages/ProductListPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import WishlistPage from "./pages/WishlistPage";
import NotificationsPage from "./pages/NotificationsPage";
import RefundPage from "./pages/RefundPage";
import SellerPage from "./pages/SellerPage";
import AdminPage from "./pages/AdminPage";
import VnpayResultPage from "./pages/VnpayResultPage";
import ChatWidget from "./components/chat/ChatWidget";
import { useAuth } from "./pages/Authcontext";

function resolvePage(path, isAuthenticated, user) {
  if (path === "/admin" || path.startsWith("/admin/")) {
    if (!isAuthenticated) return <LoginPage />;
    if (user?.role !== "ADMIN") {
      return (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <h2 style={{ fontSize: "24px", color: "#dc2626", fontWeight: "800" }}>403 - Quyền Truy Cập Bị Từ Chối</h2>
          <p style={{ color: "#64748b", marginTop: "8px", marginBottom: "20px" }}>
            Tài khoản của bạn không có quyền quản trị viên để truy cập trang này.
          </p>
          <a
            href="/"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              backgroundColor: "#ee4d2d",
              color: "#fff",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "700",
            }}
          >
            Quay Về Trang Chủ
          </a>
        </div>
      );
    }
    return <AdminPage />;
  }

  if (path === "/register") return <RegisterPage />;
  if (path === "/login") return <LoginPage />;
  if (path === "/oauth2/success") return <OAuth2SuccessPage />;
  
  if (path === "/profile" || path === "/addresses" || path === "/address-book") return isAuthenticated ? <ProfilePage /> : <LoginPage />;
  if (path === "/cart") return <CartPage />;
  if (path === "/checkout") return <CheckoutPage />;
  if (path === "/payment/vnpay-result") return <VnpayResultPage />;
  if (path === "/wishlist") return <WishlistPage />;
  if (path === "/notifications") return <NotificationsPage />;
  if (path === "/refunds") return <RefundPage />;
  
  if (path.startsWith("/orders/")) return <OrderDetailPage />;
  if (path === "/orders") return <OrdersPage />;
  
  if (path.startsWith("/product/")) return <ProductDetailPage />;
  if (path === "/products" || path === "/search" || path === "/catalog") return <ProductListPage />;
  if (path === "/seller") return <SellerPage />;
  
  // Default home page
  return <HomePage />;
}

export default function App() {
  const path = window.location.pathname;
  const { user, isAuthenticated, loading } = useAuth();

  if (path === "/oauth2/success") {
    return <OAuth2SuccessPage />;
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "var(--bg)",
          fontSize: "15px",
          fontWeight: "600",
          color: "var(--primary)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "8px" }}>🛒</div>
          <div>Đang tải ứng dụng DoMix...</div>
        </div>
      </div>
    );
  }

  const page = resolvePage(path, isAuthenticated, user);

  return (
    <>
      {page}
      {!path.startsWith("/seller") && !path.startsWith("/admin") && <ChatWidget />}
    </>
  );
}