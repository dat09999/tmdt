import React, { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import SubNav from "../components/layout/SubNav";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import ProductGrid from "../components/product/ProductGrid";
import { productService } from "../services/productService";
import { Flame, Sparkles, ChevronRight, Zap, ShieldCheck, Truck, Headphones } from "lucide-react";
import { formatCurrency } from "../utils/formatters";

// Smart icon mapping for categories
const CATEGORY_ICON_MAP = [
  { keywords: ["dien thoai", "phone", "iphone", "samsung", "mobile"], icon: "📱" },
  { keywords: ["tai nghe", "headphone", "earphone", "audio", "am thanh"], icon: "🎧" },
  { keywords: ["dong ho", "watch", "smartwatch"], icon: "⌚" },
  { keywords: ["thiet bi mang", "mang", "network", "router", "wifi"], icon: "🌐" },
  { keywords: ["gia dung", "do gia dung", "home", "noi com", "may hut bui"], icon: "🏠" },
  { keywords: ["may tinh bang", "tablet", "ipad"], icon: "📲" },
  { keywords: ["phu kien dien thoai", "sac", "cap", "op lung"], icon: "🔌" },
  { keywords: ["man hinh", "monitor", "display"], icon: "🖥️" },
  { keywords: ["laptop", "macbook", "notebook"], icon: "💻" },
  { keywords: ["phu kien may tinh", "ban phim", "chuot", "keyboard", "mouse"], icon: "⌨️" },
  { keywords: ["thoi trang nam", "nam", "ao nam", "quan nam"], icon: "👕" },
  { keywords: ["thoi trang nu", "nu", "ao nu", "vay", "dam"], icon: "👗" },
  { keywords: ["giay", "dep", "sneaker", "shoes"], icon: "👟" },
  { keywords: ["tui", "balo", "vi", "bag"], icon: "🎒" },
  { keywords: ["sac dep", "my pham", "son", "kem", "beauty", "cosmetic"], icon: "💄" },
  { keywords: ["suc khoe", "thuoc", "vitamin", "health"], icon: "💊" },
  { keywords: ["the thao", "sport", "gym", "bong"], icon: "⚽" },
  { keywords: ["sach", "vo", "truyen", "book"], icon: "📚" },
  { keywords: ["bach hoa", "thuc pham", "grocery", "mart"], icon: "🛒" },
  { keywords: ["camera", "may anh"], icon: "📷" },
  { keywords: ["xe", "oto", "xe may"], icon: "🚗" },
];

function getCategoryIcon(cat) {
  if (cat?.icon) return cat.icon;
  const text = `${cat?.name || ""} ${cat?.slug || ""} ${cat?.id || ""}`.toLowerCase();
  for (const item of CATEGORY_ICON_MAP) {
    if (item.keywords.some((kw) => text.includes(kw))) {
      return item.icon;
    }
  }
  return "🛍️";
}

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "bestseller" | "newest" | "discount"

  // Countdown timer for Flash Sale
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 28, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const [cats, flash, prods] = await Promise.all([
          productService.getCategories(),
          productService.getFlashSaleProducts(),
          productService.getProducts(),
        ]);
        setCategories(cats || []);
        setFlashSaleProducts(flash || []);
        setProducts(prods || []);
      } catch (err) {
        console.error("Failed to load home page data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const getFilteredProducts = () => {
    if (activeTab === "bestseller") {
      return [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    }
    if (activeTab === "discount") {
      return [...products].sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
    }
    return products;
  };

  return (
    <div className="page-shell">
      <Header />
      <SubNav activeTab="home" />

      <main className="page-content">
        <div className="container">
          {/* Hero Banner Section */}
          <section style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: "12px",
              }}
            >
              {/* Main Banner */}
              <div
                className="card"
                style={{
                  background: "linear-gradient(135deg, #ee4d2d 0%, #ff7a00 100%)",
                  color: "#fff",
                  padding: "36px 32px",
                  borderRadius: "var(--r-lg)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                  minHeight: "230px",
                }}
              >
                <div style={{ position: "relative", zIndex: 2, maxWidth: "440px" }}>
                  <span
                    style={{
                      backgroundColor: "rgba(255,255,255,0.25)",
                      padding: "4px 10px",
                      borderRadius: "99px",
                      fontSize: "12px",
                      fontWeight: "800",
                      letterSpacing: "0.5px",
                    }}
                  >
                    SIÊU ĐẠI TIỆC 9.9
                  </span>
                  <h1
                    style={{
                      fontSize: "28px",
                      fontWeight: "900",
                      lineHeight: "1.2",
                      marginTop: "12px",
                      marginBottom: "8px",
                    }}
                  >
                    Flash Sale Công Nghệ & Thời Trang Giảm Đến 50% 🔥
                  </h1>
                  <p style={{ fontSize: "14px", opacity: 0.95, marginBottom: "18px" }}>
                    Voucher Freeship 0Đ • Giảm thêm 100K cho đơn đầu tiên
                  </p>
                  <a
                    href="/products"
                    className="btn"
                    style={{
                      backgroundColor: "var(--accent-gold)",
                      color: "#78350f",
                      fontWeight: "800",
                      padding: "10px 22px",
                      borderRadius: "var(--r-sm)",
                      display: "inline-flex",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  >
                    Săn Deal Ngay
                  </a>
                </div>

                {/* Decorative circles */}
                <div
                  style={{
                    position: "absolute",
                    right: "-40px",
                    bottom: "-40px",
                    width: "220px",
                    height: "220px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.12)",
                    pointerEvents: "none",
                  }}
                />
              </div>

              {/* Side Banners (Promo Highlights) */}
              <div
                className="hide-mobile"
                style={{ display: "flex", flexDirection: "column", gap: "12px" }}
              >
                <div
                  className="card"
                  style={{
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#fff",
                    padding: "20px",
                    borderRadius: "var(--r-lg)",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: "700", opacity: 0.9 }}>
                    MIỄN PHÍ VẬN CHUYỂN
                  </span>
                  <h3 style={{ fontSize: "17px", fontWeight: "800", marginTop: "4px" }}>
                    Freeship Xtra Toàn Quốc
                  </h3>
                  <span style={{ fontSize: "12px", opacity: 0.9, marginTop: "4px" }}>
                    Áp dụng cho mọi đơn từ 50K
                  </span>
                </div>

                <div
                  className="card"
                  style={{
                    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                    color: "#fff",
                    padding: "20px",
                    borderRadius: "var(--r-lg)",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: "700", opacity: 0.9 }}>
                    HÀNG CHÍNH HÃNG
                  </span>
                  <h3 style={{ fontSize: "17px", fontWeight: "800", marginTop: "4px" }}>
                    DoMix Mall 100% Auth
                  </h3>
                  <span style={{ fontSize: "12px", opacity: 0.9, marginTop: "4px" }}>
                    Hoàn tiền gấp 2 lần nếu giả
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Categories Section */}
          <section style={{ marginBottom: "28px" }}>
            <div
              className="card"
              style={{
                padding: "20px",
                backgroundColor: "var(--surface)",
                borderRadius: "var(--r-lg)",
                border: "1px solid var(--border-light)",
              }}
            >
              <div className="section-header" style={{ marginBottom: "16px" }}>
                <h2 className="section-title">DANH MỤC NGÀNH HÀNG</h2>
                <a href="/products" className="section-action">
                  <span>Xem tất cả</span>
                  <ChevronRight size={14} />
                </a>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                  gap: "10px",
                }}
              >
                {categories.map((cat) => (
                  <a
                    key={cat.id}
                    href={`/products?category=${encodeURIComponent(cat.id)}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      padding: "14px 8px",
                      borderRadius: "var(--r-md)",
                      backgroundColor: "var(--surface-muted)",
                      border: "1px solid var(--border-light)",
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--primary-light)";
                      e.currentTarget.style.borderColor = "var(--border-primary)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--surface-muted)";
                      e.currentTarget.style.borderColor = "var(--border-light)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "8px",
                        borderRadius: "12px",
                        backgroundColor: "rgba(238, 77, 45, 0.08)",
                        fontSize: "26px",
                        overflow: "hidden",
                      }}
                    >
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.style.display = "flex";
                            }
                          }}
                        />
                      ) : null}
                      <span
                        style={{
                          display: cat.image ? "none" : "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1,
                        }}
                      >
                        {getCategoryIcon(cat)}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "var(--text)",
                        lineHeight: "1.3",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {cat.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* Flash Sale Section */}
          {flashSaleProducts.length > 0 && (
            <section id="flash-sale" style={{ marginBottom: "28px" }}>
              <div
                className="card"
                style={{
                  backgroundColor: "var(--surface)",
                  borderRadius: "var(--r-lg)",
                  border: "1px solid var(--border-light)",
                  overflow: "hidden",
                  padding: "18px 20px",
                }}
              >
                {/* Flash Sale Header with Timer */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    paddingBottom: "14px",
                    borderBottom: "1px solid var(--border-light)",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Flame size={24} color="var(--primary)" fill="var(--primary)" />
                      <span
                        style={{
                          fontSize: "20px",
                          fontWeight: "900",
                          color: "var(--primary)",
                          letterSpacing: "-0.5px",
                          textTransform: "uppercase",
                        }}
                      >
                        FLASH SALE
                      </span>
                    </div>

                    {/* Countdown Boxes */}
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span
                        style={{
                          backgroundColor: "#111827",
                          color: "#fff",
                          fontWeight: "800",
                          fontSize: "13px",
                          padding: "3px 6px",
                          borderRadius: "4px",
                          minWidth: "26px",
                          textAlign: "center",
                        }}
                      >
                        {String(timeLeft.hours).padStart(2, "0")}
                      </span>
                      <span style={{ fontWeight: "800", color: "#111827" }}>:</span>
                      <span
                        style={{
                          backgroundColor: "#111827",
                          color: "#fff",
                          fontWeight: "800",
                          fontSize: "13px",
                          padding: "3px 6px",
                          borderRadius: "4px",
                          minWidth: "26px",
                          textAlign: "center",
                        }}
                      >
                        {String(timeLeft.minutes).padStart(2, "0")}
                      </span>
                      <span style={{ fontWeight: "800", color: "#111827" }}>:</span>
                      <span
                        style={{
                          backgroundColor: "#111827",
                          color: "#fff",
                          fontWeight: "800",
                          fontSize: "13px",
                          padding: "3px 6px",
                          borderRadius: "4px",
                          minWidth: "26px",
                          textAlign: "center",
                        }}
                      >
                        {String(timeLeft.seconds).padStart(2, "0")}
                      </span>
                    </div>
                  </div>

                  <a href="/products" className="section-action">
                    <span>Xem tất cả Deal Sốc</span>
                    <ChevronRight size={14} />
                  </a>
                </div>

                {/* Flash Sale Grid */}
                <ProductGrid products={flashSaleProducts} loading={loading} />
              </div>
            </section>
          )}

          {/* Daily Recommendations Tabs & Product Grid */}
          <section style={{ marginBottom: "32px" }}>
            <div
              style={{
                position: "sticky",
                top: "var(--topbar-h)",
                zIndex: 10,
                backgroundColor: "var(--bg)",
                padding: "8px 0 14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  borderBottom: "2px solid var(--border-light)",
                  backgroundColor: "var(--surface)",
                  borderRadius: "var(--r-md)",
                  padding: "6px",
                  boxShadow: "var(--shadow-sm)",
                  overflowX: "auto",
                }}
              >
                {[
                  { id: "all", label: "🌟 Gợi Ý Cho Bạn" },
                  { id: "bestseller", label: "🔥 Bán Chạy Nhất" },
                  { id: "discount", label: "⚡ Giảm Giá Sâu" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      borderRadius: "var(--r-sm)",
                      backgroundColor: activeTab === tab.id ? "var(--primary)" : "transparent",
                      color: activeTab === tab.id ? "#fff" : "var(--text)",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              <ProductGrid products={getFilteredProducts()} loading={loading} />
            </div>

            {/* View More Button */}
            <div style={{ textAlign: "center", marginTop: "32px" }}>
              <a
                href="/products"
                className="btn btn-outline btn-lg"
                style={{
                  minWidth: "240px",
                  borderRadius: "var(--r-md)",
                  borderWidth: "1.5px",
                  fontWeight: "700",
                }}
              >
                Xem Thêm Nhiều Sản Phẩm Hơn
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}