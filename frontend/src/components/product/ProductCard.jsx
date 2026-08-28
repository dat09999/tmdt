import React from "react";
import { Star, Heart, ShoppingBag } from "lucide-react";
import { formatCurrency, formatSoldCount } from "../../utils/formatters";
import { wishlistService } from "../../services/wishlistService";

export default function ProductCard({ product, onWishlistToggle }) {
  if (!product) return null;

  // Compute price
  const variantPrices = (product.variants || [])
    .filter((item) => item?.active !== false)
    .map((item) => Number(item.discountPrice ?? item.price))
    .filter(Number.isFinite);

  const minPrice = variantPrices.length ? Math.min(...variantPrices) : Number(product.basePrice || 0);
  const maxPrice = variantPrices.length ? Math.max(...variantPrices) : Number(product.basePrice || 0);

  const priceLabel = Number.isFinite(minPrice)
    ? minPrice === maxPrice
      ? formatCurrency(minPrice)
      : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`
    : "Liên hệ";

  const mainImage =
    product.images?.find((img) => img.isMain)?.url ||
    product.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80";

  const discountPercent =
    product.discountPercent ||
    (product.originalPrice && product.basePrice && product.originalPrice > product.basePrice
      ? Math.round(((product.originalPrice - product.basePrice) / product.originalPrice) * 100)
      : 0);

  return (
    <article
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        position: "relative",
        background: "var(--surface)",
        borderRadius: "var(--r-md)",
        border: "1px solid var(--border-light)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        height: "100%",
      }}
      onClick={() => (window.location.href = `/product/${product.id}`)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--shadow-card)";
      }}
    >
      {/* Image Thumbnail Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "100%", /* 1:1 Aspect Ratio */
          overflow: "hidden",
          backgroundColor: "#f8f8f8",
        }}
      >
        <img
          src={mainImage}
          alt={product.name}
          loading="lazy"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.3s ease",
          }}
        />

        {/* Mall / Official Badge */}
        {product.isMall && (
          <span
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              backgroundColor: "#d0011b",
              color: "#ffffff",
              fontSize: "10px",
              fontWeight: "800",
              padding: "2px 6px",
              borderRadius: "3px",
              letterSpacing: "0.5px",
            }}
          >
            MALL
          </span>
        )}

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              backgroundColor: "rgba(255, 230, 0, 0.95)",
              color: "var(--primary-dark)",
              padding: "3px 6px",
              fontSize: "11px",
              fontWeight: "900",
              borderBottomLeftRadius: "6px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              lineHeight: 1,
            }}
          >
            <span>-{discountPercent}%</span>
            <span style={{ fontSize: "9px", color: "var(--primary)", marginTop: "2px" }}>GIẢM</span>
          </div>
        )}

        {/* Flash Sale Progress bar overlay if active */}
        {product.isFlashSale && product.flashSaleStock && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "rgba(238, 77, 45, 0.9)",
              color: "#fff",
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>🔥 FLASH SALE</span>
            <span>Đã bán {product.flashSaleSold || 0}</span>
          </div>
        )}
      </div>

      {/* Body Details */}
      <div
        style={{
          padding: "10px 12px 12px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "space-between",
        }}
      >
        <div>
          {/* Product Name */}
          <h3
            style={{
              fontSize: "13px",
              fontWeight: "500",
              color: "var(--text)",
              lineHeight: "1.4",
              height: "36px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              marginBottom: "8px",
            }}
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Vouchers & Badges */}
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "8px" }}>
            <span
              style={{
                fontSize: "10px",
                color: "var(--primary)",
                border: "1px solid var(--border-primary)",
                backgroundColor: "var(--primary-light)",
                padding: "1px 4px",
                borderRadius: "2px",
                fontWeight: "600",
              }}
            >
              Freeship Xtra
            </span>
            {product.discountPercent > 20 && (
              <span
                style={{
                  fontSize: "10px",
                  color: "#059669",
                  border: "1px solid #a7f3d0",
                  backgroundColor: "#ecfdf5",
                  padding: "1px 4px",
                  borderRadius: "2px",
                  fontWeight: "600",
                }}
              >
                Giảm {formatCurrency(50000)}
              </span>
            )}
          </div>
        </div>

        <div>
          {/* Price */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "6px" }}>
            <span
              style={{
                fontSize: "15px",
                fontWeight: "800",
                color: "var(--primary)",
              }}
            >
              {priceLabel}
            </span>
            {product.originalPrice && product.originalPrice > minPrice && (
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--text-tertiary)",
                  textDecoration: "line-through",
                }}
              >
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Meta Info: Rating, Sold, Location */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "var(--text-secondary)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {product.rating > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
                  <Star size={11} fill="#ffaa00" color="#ffaa00" />
                  <span style={{ fontWeight: "700", color: "#d97706" }}>
                    {product.rating.toFixed(1)}
                  </span>
                </span>
              )}
              {product.soldCount > 0 && (
                <span>Đã bán {formatSoldCount(product.soldCount)}</span>
              )}
            </div>

            {product.location && (
              <span style={{ color: "var(--text-tertiary)", fontSize: "10px" }}>
                {product.location}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
