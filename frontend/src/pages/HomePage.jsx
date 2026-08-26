import { useEffect, useState } from "react";
import { API_BASE_URL, authFetch } from "../utils/auth";
import { useAuth } from "./Authcontext";
import Header from "../components/Header";
import "./HomePage.css";

export default function HomePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [categoryLoading, setCategoryLoading] = useState(false);

  useEffect(() => {
    if (!user?.userId) { window.location.href = "/login"; return; }
    fetchCategories();
    fetchProducts();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      setCategoryLoading(true);
      const response = await fetch(`${API_BASE_URL}/categories`);
      const data = await response.json();
      if (response.ok) setCategories(data);
    } finally { setCategoryLoading(false); }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/products`;
      if (search.trim()) url = `${API_BASE_URL}/products/search?keyword=${encodeURIComponent(search.trim())}`;
      else if (selectedCategory) url = `${API_BASE_URL}/products/category/${encodeURIComponent(selectedCategory)}`;
      const data = await authFetch(url);
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error.message || "Không tải được sản phẩm");
    } finally { setLoading(false); }
  };

  const handleSearch = async (e) => { e.preventDefault(); await fetchProducts(); };

  return (
    <div className="page-shell">
      <Header>
        <form className="topbar-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Tìm kiếm</button>
        </form>
      </Header>

      {/* BANNER */}
      <div className="home-banner">
        <div className="home-banner-text">
          <h2>Flash Sale hôm nay — Giảm đến 50%! 🔥</h2>
          <p>Hàng chính hãng, giao nhanh toàn quốc, hoàn tiền 100%</p>
        </div>
        <button className="btn-primary" onClick={() => window.location.href = "/"}>Xem ngay</button>
      </div>

      {/* TOOLBAR */}
      <div className="home-toolbar">
        <div className="category-row">
          <button className={!selectedCategory ? "category-chip active" : "category-chip"} onClick={() => setSelectedCategory("")}>Tất cả</button>
          {categoryLoading ? <span style={{fontSize:12,color:"var(--text-3)"}}>Đang tải...</span> : categories.map((cat) => (
            <button
              key={cat.id || cat._id || cat.name}
              className={selectedCategory === (cat.id ?? cat._id) ? "category-chip active" : "category-chip"}
              onClick={() => setSelectedCategory(cat.id ?? cat._id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* FLASH MSG */}
      {message && <div className="home-message">{message}</div>}

      {/* PRODUCT SECTION */}
      <div className="product-section">
        <div className="section-title">Sản phẩm nổi bật</div>

        {loading ? (
          <div className="loading-grid">
            {Array.from({length: 10}).map((_,i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton skeleton-img" />
                <div className="skeleton-body">
                  <div className="skeleton skeleton-line" style={{width:"90%"}} />
                  <div className="skeleton skeleton-line" style={{width:"60%"}} />
                  <div className="skeleton skeleton-line" style={{width:"40%"}} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state"><p>Không tìm thấy sản phẩm nào.</p></div>
        ) : (
          <div className="product-grid">
            {products.map((product) => {
              const variantPrices = (product.variants || [])
                .filter(item => item?.active !== false)
                .map(item => Number(item.discountPrice ?? item.price))
                .filter(Number.isFinite);
              const minPrice = variantPrices.length ? Math.min(...variantPrices) : Number(product.basePrice);
              const maxPrice = variantPrices.length ? Math.max(...variantPrices) : Number(product.basePrice);
              const priceLabel = Number.isFinite(minPrice)
                ? minPrice === maxPrice
                  ? `${minPrice.toLocaleString()}đ`
                  : `${minPrice.toLocaleString()}đ - ${maxPrice.toLocaleString()}đ`
                : "Liên hệ";
              const imageUrl = product.images?.find(img => img.isMain)?.url || product.images?.[0]?.url || "https://via.placeholder.com/300x300?text=No+Image";
              return (
                <article
                  key={product.id}
                  className="product-card"
                  onClick={() => window.location.href = `/product/${product.id}`}
                >
                  <div className="product-image">
                    <img src={imageUrl} alt={product.name} loading="lazy" />
                    {product.soldCount > 0 && <span className="product-sold-badge">Đã bán {product.soldCount}</span>}
                  </div>
                  <div className="product-body">
                    <strong>{product.name}</strong>
                    <div className="product-price">{priceLabel}</div>
                    <div className="product-meta-row">
                      {product.rating ? (
                        <span className="product-rating"><span>★</span> {product.rating.toFixed(1)}</span>
                      ) : <span />}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}