import { useEffect, useState } from "react";
import { API_BASE_URL, authFetch } from "../utils/auth";
import { useAuth } from "./Authcontext";
import Header from "../components/Header";
import "./WishlistPage.css";

export default function WishlistPage() {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!user?.userId) { window.location.href = "/login"; return; }
    (async () => {
      try {
        setLoading(true);
        const data = await authFetch(`${API_BASE_URL}/wishlist/${user.userId}`);
        setWishlist(Array.isArray(data) ? data : (data?.items || []));
      } catch (err) { setMessage(err.message || "Không tải được wishlist"); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleRemove = async (productId) => {
    try {
      setLoading(true);
      await authFetch(`${API_BASE_URL}/wishlist/${user.userId}/item/${productId}`, { method: "DELETE" });
      setWishlist(w => w.filter(i => (i.productId||i.id) !== productId));
      setMessage("Đã xoá khỏi danh sách yêu thích.");
    } catch (err) { setMessage(err.message || "Không xoá được."); }
    finally { setLoading(false); }
  };

  const handleAddToCart = async (item) => {
    try {
      setLoading(true);
      await authFetch(`${API_BASE_URL}/cart`, {
        method: "POST",
        body: JSON.stringify({ userId: user.userId, productId: item.productId||item.id, variantSku: item.variantSku, quantity: 1 }),
      });
      setMessage("Đã thêm vào giỏ hàng!");
    } catch (err) { setMessage(err.message || "Không thêm được."); }
    finally { setLoading(false); }
  };

  return (
    <div className="wishlist-page">
      <Header />

      <div className="wishlist-body">
        {message && <div className="wishlist-message">{message}</div>}
        <div className="wishlist-header-row">
          <div className="section-title">Sản phẩm yêu thích</div>
          <span className="wishlist-count">{wishlist.length} sản phẩm</span>
        </div>

        {loading ? (
          <div className="wishlist-empty">Đang tải...</div>
        ) : wishlist.length === 0 ? (
          <div className="wishlist-empty">
            <p>Chưa có sản phẩm yêu thích.</p>
            <button className="btn-primary" style={{marginTop:12}} onClick={() => window.location.href = "/"}>Khám phá ngay</button>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.map((item, i) => {
              const id = item.productId || item.id;
              const img = item.image || item.imageUrl || "https://via.placeholder.com/220";
              const name = item.productName || item.name || "Sản phẩm";
              const price = item.price || item.basePrice;
              return (
                <div key={i} className="wishlist-item">
                  <div className="wishlist-item-img">
                    <img src={img} alt={name} onClick={() => window.location.href = `/product/${id}`} style={{cursor:"pointer"}} />
                    <button className="wishlist-remove-btn" onClick={() => handleRemove(id)} title="Xoá">✕</button>
                  </div>
                  <div className="wishlist-item-body">
                    <div className="wishlist-item-name">{name}</div>
                    {item.brand && <div className="wishlist-item-brand">{item.brand}</div>}
                    <div className="wishlist-item-price">{price ? `${price.toLocaleString()}đ` : "Liên hệ"}</div>
                    <div className="wishlist-item-actions">
                      <button className="btn-primary" onClick={() => handleAddToCart(item)}>+ Giỏ hàng</button>
                      <button className="btn-secondary" onClick={() => window.location.href = `/product/${id}`}>Xem</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
