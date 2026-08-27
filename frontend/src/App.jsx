import LoginPage from "./pages/LoginPage";
import OAuth2SuccessPage from "./pages/OAuth2SuccessPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/register";
import HomePage from "./pages/HomePage";
import CartPage from "./pages/CartPage";
import WishlistPage from "./pages/WishlistPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import NotificationsPage from "./pages/NotificationsPage";
import CheckoutPage from "./pages/CheckoutPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import VnpayResultPage from "./pages/VnpayResultPage";
import ShopDetailPage from "./pages/ShopDetailPage";
import SellerPage from "./pages/SellerPage";
import ChatWidget from "./components/ChatWidget";
import { useAuth } from "./pages/Authcontext";

function resolvePage(path, isAuthenticated) {
  if (path === "/register") return <RegisterPage />;
  if (path === "/profile") return isAuthenticated ? <ProfilePage /> : <LoginPage />;
  if (path === "/cart") return <CartPage />;
  if (path === "/wishlist") return <WishlistPage />;
  if (path.startsWith("/orders/")) return <OrderDetailPage />;
  if (path === "/orders") return <OrdersPage />;
  if (path === "/checkout") return <CheckoutPage />;
  if (path === "/payment/vnpay-result") return <VnpayResultPage />;
  if (path === "/notifications") return <NotificationsPage />;
  if (path.startsWith("/product/")) return <ProductDetailPage />;
  if (path.startsWith("/shop/")) return <ShopDetailPage />;
  if (path === "/seller") return <SellerPage />;
  if (path === "/" || path === "/home") return isAuthenticated ? <HomePage /> : <LoginPage />;
  if (path === "/login") return <LoginPage />;
  return isAuthenticated ? <HomePage /> : <LoginPage />;
}

export default function App() {
  const path = window.location.pathname;
  const { isAuthenticated, loading } = useAuth();

  // Trang OAuth callback hiện riêng, không kèm chat widget vì chưa xác thực xong.
  if (path === "/oauth2/success") {
    return <OAuth2SuccessPage />;
  }

  if (loading) {
    return <div className="app-loading">Loading...</div>;
  }

  const page = resolvePage(path, isAuthenticated);

  return (
    <>
      {page}
      <ChatWidget />
    </>
  );
}