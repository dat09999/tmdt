import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, authFetch } from "../utils/auth";
import Header from "../components/Header";
import { useAuth } from "./Authcontext";
import "./ShopDetailPage.css";

const FALLBACK_COVER = "linear-gradient(120deg, #ee4d2d, #ff9c68)";

function productImage(product) {
  return product.images?.find((image) => image.isMain)?.url
    || product.images?.[0]?.url
    || "https://via.placeholder.com/400x400?text=DoMix";
}

function productPrice(product) {
  const prices = (product.variants || [])
    .filter((variant) => variant?.active !== false)
    .map((variant) => Number(variant.discountPrice ?? variant.price))
    .filter(Number.isFinite);
  const lowest = prices.length ? Math.min(...prices) : Number(product.basePrice);
  return Number.isFinite(lowest) ? `${lowest.toLocaleString("vi-VN")} ₫` : "Liên hệ";
}

function joinedLabel(createdAt) {
  if (!createdAt || Number.isNaN(new Date(createdAt).getTime())) return "Chưa rõ";
  return new Date(createdAt).toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
}

export default function ShopDetailPage() {
  const { user } = useAuth();
  const shopId = decodeURIComponent(window.location.pathname.replace("/shop/", ""));
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [follow, setFollow] = useState(null);

  useEffect(() => {
    if (!shopId) {
      setError("Không tìm thấy shop.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const [shopData, productData] = await Promise.all([
          authFetch(`${API_BASE_URL}/shops/${shopId}`),
          authFetch(`${API_BASE_URL}/products/shop/${shopId}`),
        ]);
        setShop(shopData);
        setProducts(Array.isArray(productData) ? productData : []);
        if (user?.userId) {
          const followData = await authFetch(`${API_BASE_URL}/shops/${shopId}/follow?userId=${user.userId}`);
          setFollow(followData);
        }
      } catch (requestError) {
        setError(requestError.message || "Không thể tải thông tin shop.");
      } finally {
        setLoading(false);
      }
    })();
  }, [shopId]);

  const toggleFollow = async () => {
    if (!user?.userId) { window.location.href = "/login"; return; }
    const method = follow?.following ? "DELETE" : "POST";
    const data = await authFetch(`${API_BASE_URL}/shops/${shopId}/follow?userId=${user.userId}`, { method });
    setFollow(data);
  };

  const visibleProducts = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi-VN");
    return keyword ? products.filter((product) => product.name?.toLocaleLowerCase("vi-VN").includes(keyword)) : products;
  }, [products, search]);

  const address = [shop?.address?.detail, shop?.address?.ward, shop?.address?.district, shop?.address?.province]
    .filter(Boolean)
    .join(", ");
  const isActive = shop?.status === "ACTIVE";

  return (
    <div className="shop-page page-shell">
      <Header />
      <main className="shop-page-body">
        <div className="shop-breadcrumb"><a href="/">Trang chủ</a><span>/</span><span>{shop?.shopName || "Shop"}</span></div>

        {loading ? (
          <div className="shop-loading card"><div className="skeleton shop-loading-cover" /><div className="skeleton shop-loading-line" /><div className="skeleton shop-loading-line short" /></div>
        ) : error ? (
          <div className="shop-error card"><h2>Không thể mở shop</h2><p>{error}</p><a className="btn-primary" href="/">Về trang chủ</a></div>
        ) : (
          <>
            <section className="shop-hero card">
              <div className="shop-cover" style={shop.coverImage ? { backgroundImage: `url("${shop.coverImage}")` } : { background: FALLBACK_COVER }} />
              <div className="shop-summary">
                <img className="shop-logo" src={shop.logo || "https://via.placeholder.com/120?text=Shop"} alt={shop.shopName} />
                <div className="shop-heading">
                  <div className="shop-name-row"><h1>{shop.shopName || "Shop"}</h1><span className={`shop-status ${isActive ? "active" : "inactive"}`}>{isActive ? "Đang hoạt động" : shop.status || "Chưa rõ"}</span></div>
                  <p>Tham gia từ {joinedLabel(shop.createdAt)}</p>
                  <div className="shop-actions">
                    <button type="button" className="btn-secondary" onClick={toggleFollow}>{follow?.following ? "Đang theo dõi" : "Theo dõi shop"}{follow ? ` (${follow.followerCount})` : ""}</button>
                    {shop.phone && <a className="btn-primary" href={`tel:${shop.phone}`}>Liên hệ shop</a>}
                    {shop.email && <a className="btn-secondary" href={`mailto:${shop.email}`}>Email</a>}
                  </div>
                </div>
              </div>
              <div className="shop-stats">
                <div><strong>{Number(shop.rating || 0).toFixed(1)} <span>★</span></strong><small>Đánh giá</small></div>
                <div><strong>{Number(shop.totalReviews || 0).toLocaleString("vi-VN")}</strong><small>Lượt đánh giá</small></div>
                <div><strong>{Number(shop.totalSales || 0).toLocaleString("vi-VN")}</strong><small>Đã bán</small></div>
              </div>
            </section>

            <section className="shop-content">
              <aside className="shop-about card">
                <h2>Thông tin shop</h2>
                <p className="shop-description">{shop.description || "Shop chưa cập nhật phần giới thiệu."}</p>
                {address && <div className="shop-contact"><span>📍</span><p>{address}</p></div>}
                {shop.phone && <div className="shop-contact"><span>📞</span><p>{shop.phone}</p></div>}
                {shop.email && <div className="shop-contact"><span>✉️</span><p>{shop.email}</p></div>}
              </aside>

              <section className="shop-products">
                <div className="shop-products-header">
                  <div><h2>Sản phẩm của shop</h2><p>{products.length} sản phẩm</p></div>
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm trong shop" aria-label="Tìm sản phẩm trong shop" />
                </div>
                {visibleProducts.length === 0 ? (
                  <div className="shop-no-products card">{search ? "Không tìm thấy sản phẩm phù hợp." : "Shop chưa có sản phẩm nào."}</div>
                ) : (
                  <div className="shop-product-grid">
                    {visibleProducts.map((product) => (
                      <article className="shop-product-card" key={product.id} onClick={() => { window.location.href = `/product/${product.id}`; }}>
                        <img src={productImage(product)} alt={product.name} loading="lazy" />
                        <div className="shop-product-info">
                          <h3>{product.name}</h3>
                          <strong>{productPrice(product)}</strong>
                          <div><span>{product.rating ? `★ ${Number(product.rating).toFixed(1)}` : "Chưa có đánh giá"}</span><span>Đã bán {Number(product.soldCount || 0).toLocaleString("vi-VN")}</span></div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
