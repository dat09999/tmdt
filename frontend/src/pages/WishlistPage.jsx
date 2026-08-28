import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import SubNav from "../components/layout/SubNav";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import ProductGrid from "../components/product/ProductGrid";
import EmptyState from "../components/common/EmptyState";
import { wishlistService } from "../services/wishlistService";
import { useAuth } from "./Authcontext";
import { Heart } from "lucide-react";

export default function WishlistPage() {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wishlistService
      .getWishlist(user?.userId)
      .then((data) => setWishlist(data || []))
      .catch((err) => console.error("Fetch wishlist failed:", err))
      .finally(() => setLoading(false));
  }, [user?.userId]);

  return (
    <div className="page-shell">
      <Header />
      <SubNav activeTab="wishlist" />

      <main className="page-content">
        <div className="container">
          <div className="section-header" style={{ marginBottom: "20px" }}>
            <h1 className="section-title" style={{ fontSize: "20px" }}>
              DANH SÁCH YÊU THÍCH ({wishlist.length} sản phẩm)
            </h1>
          </div>

          {wishlist.length === 0 && !loading ? (
            <EmptyState
              icon={Heart}
              title="Danh sách yêu thích đang trống"
              description="Hãy bấm thả tim các sản phẩm bạn yêu thích để dễ dàng theo dõi giảm giá nhé!"
              actionText="Khám phá sản phẩm ngay"
              onAction={() => (window.location.href = "/products")}
            />
          ) : (
            <ProductGrid products={wishlist} loading={loading} />
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
