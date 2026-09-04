import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import SubNav from "../components/layout/SubNav";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import ProductGallery from "../components/product/ProductGallery";
import VariantPicker from "../components/product/VariantPicker";
import ReviewSection from "../components/product/ReviewSection";
import ProductGrid from "../components/product/ProductGrid";
import Button from "../components/common/Button";
import RatingStars from "../components/common/RatingStars";
import { productService } from "../services/productService";
import { cartService } from "../services/cartService";
import { wishlistService } from "../services/wishlistService";
import { sellerService } from "../services/sellerService";
import { openChatWithShop } from "../services/chatService";
import { useAuth } from "./Authcontext";
import { formatCurrency, formatSoldCount } from "../utils/formatters";
import {
  ShoppingCart,
  Zap,
  Heart,
  Store,
  MessageCircle,
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
  Check,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";

export default function ProductDetailPage() {
  const { user } = useAuth();
  const productId = window.location.pathname.split("/product/")[1] || "sp-01";

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [userShop, setUserShop] = useState(null);

  useEffect(() => {
    if (user?.userId) {
      sellerService.getShopByOwnerId(user.userId).then((s) => setUserShop(s)).catch(() => {});
    }
  }, [user?.userId]);

  const isShopOwner = !!(
    user?.userId && (
      (product?.shop?.ownerId && String(product.shop.ownerId) === String(user.userId)) ||
      (product?.ownerId && String(product.ownerId) === String(user.userId)) ||
      (userShop?.id && product?.shopId && String(userShop.id) === String(product.shopId)) ||
      (userShop?.id && product?.shop?.id && String(userShop.id) === String(product.shop.id))
    )
  );

  useEffect(() => {
    const loadDetail = async () => {
      try {
        setLoading(true);
        const data = await productService.getProductById(productId);
        setProduct(data);
        if (data?.variants?.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
        setIsWishlisted(wishlistService.isWishlisted(productId));

        // Load reviews and summary
        const [reviewsList, ratingSummary] = await Promise.all([
          productService.getProductReviews(productId),
          productService.getProductRatingSummary(productId),
        ]);

        if (Array.isArray(reviewsList) && reviewsList.length > 0) {
          data.reviews = reviewsList;
        }
        if (ratingSummary?.avgRating) {
          data.rating = ratingSummary.avgRating;
          data.reviewCount = ratingSummary.totalReviews;
        }

        // Load related products
        const allProds = await productService.getProducts();
        setRelatedProducts((allProds || []).filter((p) => p.id !== productId).slice(0, 6));
      } catch (err) {
        console.error("Failed to load product detail:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [productId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleAddToCart = async () => {
    if (isShopOwner) {
      showToast("🚫 Bạn không thể tự thêm sản phẩm của chính shop mình vào giỏ hàng!");
      return;
    }

    try {
      setAddingToCart(true);
      const cartItem = {
        productId: product.id,
        productName: product.name,
        variantSku: selectedVariant?.sku || "",
        variantName: selectedVariant?.name || [selectedVariant?.color, selectedVariant?.size].filter(Boolean).join(" - ") || "Tiêu chuẩn",
        price: selectedVariant?.discountPrice ?? selectedVariant?.price ?? product.basePrice,
        quantity,
        image: product.images?.[0]?.url || "",
        shopId: product.shop?.id || "shop-official",
        shopName: product.shop?.name || "DoMix Mall",
      };

      await cartService.addToCart(user?.userId, cartItem);
      showToast("Đã thêm sản phẩm vào giỏ hàng thành công!");
    } catch (err) {
      showToast("Không thể thêm vào giỏ: " + err.message);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (isShopOwner) {
      showToast("🚫 Bạn không thể tự đặt mua sản phẩm từ chính shop của mình!");
      return;
    }

    await handleAddToCart();
    window.location.href = "/cart";
  };

  const handleToggleWishlist = async () => {
    const { isAdded } = await wishlistService.toggleWishlist(user?.userId, product);
    setIsWishlisted(isAdded);
    showToast(isAdded ? "Đã thêm vào danh sách yêu thích" : "Đã xóa khỏi yêu thích");
  };

  if (loading || !product) {
    return (
      <div className="page-shell">
        <Header />
        <div className="container" style={{ padding: "40px 16px", textAlign: "center" }}>
          <div className="skeleton" style={{ width: "100%", height: "400px", borderRadius: "12px" }} />
        </div>
      </div>
    );
  }

  const currentPrice = selectedVariant?.discountPrice ?? selectedVariant?.price ?? product.basePrice;
  const originalPrice = product.originalPrice || currentPrice * 1.2;
  const discountPercent =
    product.discountPercent ||
    Math.round(((originalPrice - currentPrice) / originalPrice) * 100);

  return (
    <div className="page-shell">
      <Header />
      <SubNav />

      {/* Toast notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            right: "20px",
            zIndex: 9999,
            backgroundColor: toastMessage.includes("🚫") ? "#ef4444" : "#10b981",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "var(--r-md)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "600",
            fontSize: "14px",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          {toastMessage.includes("🚫") ? <ShieldAlert size={18} /> : <Check size={18} />}
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="page-content">
        <div className="container">
          {/* Main Product Box */}
          <div
            className="card"
            style={{
              padding: "24px",
              backgroundColor: "var(--surface)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--border-light)",
              display: "grid",
              gridTemplateColumns: "420px 1fr",
              gap: "32px",
              marginBottom: "24px",
            }}
          >
            {/* Left Col: Gallery */}
            <div>
              <ProductGallery images={product.images} name={product.name} />
              
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "16px",
                  paddingTop: "14px",
                  borderTop: "1px solid var(--border-light)",
                }}
              >
                <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Chia sẻ: <span>📘 💬 🔗</span>
                </div>
                <button
                  onClick={handleToggleWishlist}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: isWishlisted ? "var(--primary)" : "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  <Heart size={16} fill={isWishlisted ? "var(--primary)" : "none"} />
                  <span>{isWishlisted ? "Đã thích" : "Yêu thích"}</span>
                </button>
              </div>
            </div>

            {/* Right Col: Product Info & Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                {/* Badges & Title */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  {product.isMall && (
                    <span
                      style={{
                        backgroundColor: "#d0011b",
                        color: "#fff",
                        fontSize: "11px",
                        fontWeight: "800",
                        padding: "2px 6px",
                        borderRadius: "2px",
                      }}
                    >
                      DO MIX MALL
                    </span>
                  )}
                  {product.brand && (
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "600" }}>
                      Thương hiệu: <strong style={{ color: "var(--primary)" }}>{product.brand}</strong>
                    </span>
                  )}
                </div>

                <h1
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "var(--text)",
                    lineHeight: "1.4",
                  }}
                >
                  {product.name}
                </h1>

                {/* Rating & Sold Meta */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    marginTop: "10px",
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ fontWeight: "800", color: "var(--primary)", borderBottom: "1px solid var(--primary)" }}>
                      {product.rating?.toFixed(1) || "5.0"}
                    </span>
                    <RatingStars rating={product.rating || 5} size={14} />
                  </div>
                  <span>|</span>
                  <div>
                    <strong style={{ color: "var(--text)" }}>{product.reviewCount || 0}</strong> Đánh giá
                  </div>
                  <span>|</span>
                  <div>
                    <strong style={{ color: "var(--text)" }}>{formatSoldCount(product.soldCount || 0)}</strong> Đã bán
                  </div>
                </div>
              </div>

              {/* Price Banner */}
              <div
                style={{
                  backgroundColor: "var(--primary-light)",
                  padding: "16px 20px",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--border-primary)",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "14px",
                }}
              >
                {product.originalPrice && product.originalPrice > currentPrice && (
                  <span
                    style={{
                      fontSize: "15px",
                      color: "var(--text-tertiary)",
                      textDecoration: "line-through",
                    }}
                  >
                    {formatCurrency(originalPrice)}
                  </span>
                )}
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: "900",
                    color: "var(--primary)",
                  }}
                >
                  {formatCurrency(currentPrice)}
                </span>
                {discountPercent > 0 && (
                  <span
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: "800",
                      padding: "2px 8px",
                      borderRadius: "99px",
                    }}
                  >
                    -{discountPercent}% GIẢM
                  </span>
                )}
              </div>

              {/* Vouchers Promo */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                <span style={{ color: "var(--text-secondary)", minWidth: "110px", fontWeight: "600" }}>
                  Mã Giảm Giá:
                </span>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      backgroundColor: "#fef3c7",
                      color: "#b45309",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontWeight: "700",
                      fontSize: "11px",
                      border: "1px dashed #f59e0b",
                    }}
                  >
                    Giảm 50K
                  </span>
                  <span
                    style={{
                      backgroundColor: "#e0e7ff",
                      color: "#4338ca",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontWeight: "700",
                      fontSize: "11px",
                      border: "1px dashed #6366f1",
                    }}
                  >
                    Freeship 100%
                  </span>
                </div>
              </div>

              {/* Shipping Highlight */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px" }}>
                <span style={{ color: "var(--text-secondary)", minWidth: "110px", fontWeight: "600" }}>
                  Vận Chuyển:
                </span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#059669", fontWeight: "600" }}>
                    <Truck size={16} />
                    <span>Miễn phí vận chuyển cho đơn hàng từ 50.000₫</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Giao hàng hỏa tốc trong 2 giờ hoặc tiêu chuẩn 2-3 ngày
                  </div>
                </div>
              </div>

              {/* Variant Picker */}
              <VariantPicker
                variants={product.variants || []}
                selectedVariant={selectedVariant}
                onSelectVariant={setSelectedVariant}
                quantity={quantity}
                onQuantityChange={setQuantity}
                maxStock={selectedVariant?.stock || 50}
              />

              {/* Shop Owner Warning Alert Banner */}
              {isShopOwner && (
                <div
                  style={{
                    backgroundColor: "#fff7ed",
                    border: "1px solid #f97316",
                    borderRadius: "var(--r-md)",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    color: "#c2410c",
                    marginTop: "12px",
                  }}
                >
                  <AlertTriangle size={20} style={{ flexShrink: 0, color: "#ea580c", marginTop: "2px" }} />
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "13px" }}>
                      🏪 Đây là sản phẩm thuộc gian hàng của bạn!
                    </div>
                    <div style={{ fontSize: "12px", color: "#9a3412", marginTop: "2px", lineHeight: "1.4" }}>
                      Hệ thống tự động chặn chủ shop tự mua sản phẩm của chính mình nhằm đảm bảo tính minh bạch, chống buff đơn ảo, gian lận voucher và tự đánh giá sản phẩm.
                    </div>
                  </div>
                </div>
              )}

              {/* CTA Action Buttons */}
              <div style={{ display: "flex", gap: "14px", marginTop: "10px" }}>
                <Button
                  variant="secondary"
                  size="lg"
                  loading={addingToCart}
                  disabled={isShopOwner}
                  icon={ShoppingCart}
                  onClick={handleAddToCart}
                  title={isShopOwner ? "Bạn không thể tự mua sản phẩm từ chính shop của mình" : ""}
                  style={{
                    flex: 1,
                    opacity: isShopOwner ? 0.6 : 1,
                    cursor: isShopOwner ? "not-allowed" : "pointer",
                  }}
                >
                  Thêm Vào Giỏ Hàng
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  disabled={isShopOwner}
                  icon={Zap}
                  onClick={handleBuyNow}
                  title={isShopOwner ? "Bạn không thể tự mua sản phẩm từ chính shop của mình" : ""}
                  style={{
                    flex: 1,
                    opacity: isShopOwner ? 0.6 : 1,
                    cursor: isShopOwner ? "not-allowed" : "pointer",
                  }}
                >
                  Mua Ngay
                </Button>
              </div>
            </div>
          </div>

          {/* Shop Mini Card Section */}
          <div
            className="card"
            style={{
              padding: "20px 24px",
              backgroundColor: "var(--surface)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--border-light)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            {/* Shop Avatar & Name */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <img
                src={product.shop?.avatar || "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=100&auto=format&fit=crop&q=60"}
                alt={product.shop?.name}
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid var(--primary-light)",
                }}
              />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <strong style={{ fontSize: "16px", color: "var(--text)" }}>
                    {product.shop?.name || "Cửa Hàng Chính Hãng"}
                  </strong>
                  <span
                    style={{
                      fontSize: "10px",
                      backgroundColor: "var(--primary)",
                      color: "#fff",
                      padding: "1px 6px",
                      borderRadius: "2px",
                      fontWeight: "800",
                    }}
                  >
                    Yêu Thích
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Online {product.shop?.responseTime || "trong vài phút"}
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={MessageCircle}
                    onClick={() => {
                      openChatWithShop(product.shopId || product.shop?.id || "shop-01");
                    }}
                  >
                    Chat Ngay
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Store}
                    onClick={() => (window.location.href = `/products?category=${product.categoryId}`)}
                  >
                    Xem Shop
                  </Button>
                </div>
              </div>
            </div>

            {/* Shop Statistics */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "24px",
                fontSize: "13px",
              }}
            >
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Đánh Giá: </span>
                <strong style={{ color: "var(--primary)" }}>{product.shop?.rating || "4.9"} / 5</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Sản Phẩm: </span>
                <strong style={{ color: "var(--primary)" }}>{product.shop?.productsCount || 120}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Tỉ Lệ Phản Hồi: </span>
                <strong style={{ color: "var(--primary)" }}>{product.shop?.responseRate || "99%"}</strong>
              </div>
            </div>
          </div>

          {/* Product Description & Specifications */}
          <div
            className="card"
            style={{
              padding: "24px",
              backgroundColor: "var(--surface)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--border-light)",
              marginBottom: "24px",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "800",
                color: "var(--text)",
                marginBottom: "16px",
                textTransform: "uppercase",
              }}
            >
              Chi Tiết Sản Phẩm & Mô Tả
            </h3>

            <div
              style={{
                fontSize: "14px",
                color: "var(--text)",
                lineHeight: "1.8",
                whiteSpace: "pre-line",
              }}
            >
              {product.description || "Sản phẩm chính hãng chất lượng cao, bảo hành 12 tháng tại các trung tâm trên toàn quốc."}
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div style={{ marginBottom: "28px" }}>
            <ReviewSection
              productId={product.id || productId}
              reviews={product.reviews || []}
              averageRating={product.rating || 5}
              totalReviews={product.reviewCount || (product.reviews || []).length}
              onReviewAdded={(newRev) => {
                setProduct((prev) => ({
                  ...prev,
                  reviews: [newRev, ...(prev.reviews || [])],
                  reviewCount: (prev.reviewCount || (prev.reviews || []).length) + 1,
                }));
              }}
            />
          </div>

          {/* Related Products Carousel / Grid */}
          <section style={{ marginBottom: "32px" }}>
            <div className="section-header">
              <h2 className="section-title">CÁC SẢN PHẨM TƯƠNG TỰ BẠN CÓ THỂ THÍCH</h2>
            </div>
            <ProductGrid products={relatedProducts} />
          </section>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}