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
import VnpayResultPage from "./pages/VnpayResultPage";
import ChatWidget from "./components/chat/ChatWidget";
import { useAuth } from "./pages/Authcontext";

function resolvePage(path, isAuthenticated) {
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
  const { isAuthenticated, loading } = useAuth();

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

  const page = resolvePage(path, isAuthenticated);

  return (
    <>
      {page}
      {!path.startsWith("/seller") && <ChatWidget />}
    </>
  );
}