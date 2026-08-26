import { useEffect, useState } from "react";
import { API_BASE_URL, authFetch } from "../utils/auth";
import { useAuth } from "./Authcontext";
import Header from "../components/Header";
import "./ProductDetailPage.css";

export default function ProductDetailPage() {
  const { user, logout } = useAuth();
  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [coupons, setCoupons] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [variant, setVariant] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("desc");
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showShopDetail, setShowShopDetail] = useState(false);

  const productId = window.location.pathname.replace("/product/", "");

  const getObjId = (value) => {
    if (!value) return null;
    if (typeof value === "string") return value;
    return value.id || value._id || value.shopId || null;
  };

  const getShopIdFromProduct = (data) => {
    const rawShop = data?.shop ?? data?.store;
    return data?.shopId || data?.shop_id || data?.shopID || getObjId(rawShop);
  };

  const normalizeShop = (data, fallbackId) => {
    if (!data) return null;

    const address =
      typeof data.address === "string"
        ? { detail: data.address }
        : data.address || {};

    return {
      ...data,
      id: data.id || data._id || fallbackId,
      shopName: data.shopName || data.name || data.storeName || data.username || "Shop",
      logo: data.logo || data.logoUrl || data.avatar || data.imageUrl || "",
      rating: Number(data.rating ?? data.avgRating ?? data.averageRating ?? 0),
      totalReviews: Number(data.totalReviews ?? data.reviewCount ?? data.reviewsCount ?? 0),
      totalSales: Number(data.totalSales ?? data.soldCount ?? data.salesCount ?? 0),
      createdAt: data.createdAt || data.createdDate || data.created_at,
      status: data.status,
      address,
      phone: data.phone || data.phoneNumber || data.mobile,
      email: data.email,
      description: data.description || data.bio || data.about,
    };
  };

  useEffect(() => {
    if (!user?.userId) {
      window.location.href = "/login";
      return;
    }

    if (!productId) {
      window.location.href = "/";
      return;
    }

    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setMessage("");

      const data = await authFetch(`${API_BASE_URL}/products/${productId}`);
      setProduct(data);
      const availableVariants = (data?.variants || []).filter(
        (item) => item?.active !== false
      );
      setVariant(availableVariants.length === 1 ? availableVariants[0] : null);
      setActiveImage(0);
      setQty(1);

      fetchReviews();
      fetchRatingSummary();

      if (data?.categoryId) {
        fetchCategory(data.categoryId);
      }

      const shopId = getShopIdFromProduct(data);

      if (data?.shop && typeof data.shop === "object") {
        setShop(normalizeShop(data.shop, shopId));
      }

      if (shopId) {
        fetchShop(shopId);
        fetchCoupons(shopId);
        fetchRelated(shopId, data.id || data._id);
      } else {
        console.warn("Product không có shopId/shop:", data);
      }
    } catch (err) {
      setMessage(err.message || "Không tải được sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const fetchShop = async (shopId) => {
    try {
      const data = await authFetch(`${API_BASE_URL}/shops/${shopId}`);
      setShop(normalizeShop(data, shopId));
    } catch (err) {
      console.error("Không tải được thông tin shop:", err);
    }
  };

  const fetchCategory = async (categoryId) => {
    try {
      const data = await authFetch(`${API_BASE_URL}/categories/${categoryId}`);
      setCategoryName(data?.name || "");
    } catch (err) {
      console.error("Không tải được danh mục:", err);
    }
  };

  const fetchCoupons = async (shopId) => {
    try {
      const data = await authFetch(`${API_BASE_URL}/coupons/shop/${shopId}`);
      setCoupons((data || []).filter((c) => c.active));
    } catch (err) {
      console.error("Không tải được mã giảm giá:", err);
    }
  };

  const fetchRelated = async (shopId, excludeId) => {
    try {
      const data = await authFetch(`${API_BASE_URL}/products/shop/${shopId}`);
      setRelatedProducts((data || []).filter((p) => p.id !== excludeId).slice(0, 4));
    } catch (err) {
      console.error("Không tải được sản phẩm liên quan:", err);
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await authFetch(`${API_BASE_URL}/reviews/product/${productId}?size=50`);
      setReviews(data?.content || []);
    } catch (err) {
      console.error("Không tải được đánh giá:", err);
    }
  };

  const fetchRatingSummary = async () => {
    try {
      const data = await authFetch(`${API_BASE_URL}/reviews/product/${productId}/summary`);
      setRatingSummary(data);
    } catch (err) {
      console.error("Không tải được tổng quan đánh giá:", err);
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      const updated = await authFetch(`${API_BASE_URL}/reviews/${reviewId}/helpful`, {
        method: "POST",
      });

      setReviews((prev) => prev.map((r) => (r.id === reviewId ? updated : r)));
    } catch (err) {
      setMessage(err.message || "Không thực hiện được thao tác.");
    }
  };

  const addSelectedVariantToCart = async () => {
    if (!variant) {
      throw new Error("Vui lòng chọn phân loại sản phẩm trước.");
    }

    if (!variant.stock || variant.stock < qty) {
      throw new Error("Phân loại đã chọn không đủ số lượng trong kho.");
    }

    await authFetch(`${API_BASE_URL}/cart`, {
      method: "POST",
      body: JSON.stringify({
        userId: user.userId,
        productId: product.id || product._id,
        variantSku: variant.sku,
        quantity: qty,
      }),
    });
  };

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      setMessage("");
      await addSelectedVariantToCart();
      setMessage("Đã thêm sản phẩm vào giỏ hàng.");
    } catch (err) {
      setMessage(err.message || "Không thêm được vào giỏ hàng.");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async () => {
    try {
      setLoading(true);
      setMessage("");
      await addSelectedVariantToCart();
      sessionStorage.setItem(
        "checkoutSelectedItems",
        JSON.stringify([{
          productId: product.id || product._id,
          variantSku: variant.sku,
        }])
      );
      sessionStorage.removeItem("checkoutCouponCode");
      window.location.href = "/checkout";
    } catch (err) {
      setMessage(err.message || "Không thể mua sản phẩm này.");
      setLoading(false);
    }
  };

  const handleAddToWishlist = async () => {
    try {
      setLoading(true);
      await authFetch(`${API_BASE_URL}/wishlist`, {
        method: "POST",
        body: JSON.stringify({
          userId: user.userId,
          productId: product.id || product._id,
        }),
      });
      setMessage("Đã thêm vào danh sách yêu thích.");
    } catch (err) {
      setMessage(err.message || "Không thêm được vào yêu thích.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCoupon = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setMessage(`Đã sao chép mã "${code}".`);
    } catch (err) {
      setMessage(`Mã giảm giá: ${code}`);
    }
  };

  const handleBack = () => {
    window.location.href = "/";
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const goToShop = () => {
    const shopId = shop?.id || getShopIdFromProduct(product);
    if (shopId) window.location.href = `/shop/${shopId}`;
  };

  const handleChatShop = async () => {
  const shopId = shop?.id || getShopIdFromProduct(product);
  if (!shopId) return;
  
  try {
    // Tạo conversation với shop, query param shopId
    await authFetch(`${API_BASE_URL}/api/chat/conversations?shopId=${shopId}`, {
      method: "POST"
    });
  } catch (err) {
    console.error("Error creating chat conversation:", err);
    // Vẫn chuyển hướng dù có lỗi để người dùng thấy trang chat
  }
  
  // Chuyển hướng đến trang chat với shopId
  window.location.href = `/chat/${shopId}`;
};

  const goToProduct = (id) => {
    window.location.href = `/product/${id}`;
  };

  const changeQty = (delta) => {
    setQty((prev) => {
      const next = prev + delta;
      const max = variant?.stock ?? 99;
      if (next < 1) return 1;
      if (max && next > max) return max;
      return next;
    });
  };

  const formatJoinedAgo = (value) => {
    if (!value) return null;

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;

    const diffMs = Date.now() - d.getTime();
    if (diffMs < 0) return null;

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days < 30) return `${days} ngày trước`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months} tháng trước`;

    const years = Math.floor(months / 12);
    return `${years} năm trước`;
  };

  const isVideo = (media) => media?.imageVideo === "VIDEO";

  const images = product?.images?.length
    ? product.images
    : [{ url: "https://via.placeholder.com/700x500?text=No+Image" }];

  const activeMedia = images[activeImage] || images[0];
  const selectablePrices = (product?.variants || [])
    .filter(item => item?.active !== false)
    .map(item => Number(item.discountPrice ?? item.price))
    .filter(Number.isFinite);
  const minPrice = selectablePrices.length ? Math.min(...selectablePrices) : Number(product?.basePrice);
  const maxPrice = selectablePrices.length ? Math.max(...selectablePrices) : Number(product?.basePrice);
  const originalPrice = variant?.price ?? product?.basePrice;
  const finalPrice = variant?.discountPrice ?? variant?.price ?? product?.basePrice;
  const priceLabel = variant
    ? (Number.isFinite(Number(finalPrice)) ? `${Number(finalPrice).toLocaleString()} đ` : "Giá chưa có")
    : Number.isFinite(minPrice)
      ? minPrice === maxPrice
        ? `${minPrice.toLocaleString()} đ`
        : `${minPrice.toLocaleString()} đ - ${maxPrice.toLocaleString()} đ`
      : "Chọn phân loại để xem giá";
  const hasDiscount = variant?.discountPrice && variant.discountPrice < originalPrice;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - variant.discountPrice) / originalPrice) * 100)
    : 0;
  const shopJoinedLabel = formatJoinedAgo(shop?.createdAt);

  return (
    <div className="product-detail-page">
      <Header />
      <div className="detail-body">
        <div className="breadcrumb">
          <div className="breadcrumb-left">
            <a href="/">Trang chủ</a>
            {categoryName && (
              <>
                <span className="breadcrumb-sep">/</span>
                <a href={`/category/${product?.categoryId}`}>{categoryName}</a>
              </>
            )}
            <span className="breadcrumb-sep">/</span>
            <span>{product?.name || "Chi tiết sản phẩm"}</span>
          </div>

          <div className="breadcrumb-actions">
            <button type="button" className="btn-secondary" onClick={handleBack}>
              Quay lại
            </button>
            <button type="button" className="btn-secondary" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </div>

        {message && <div className="detail-message">{message}</div>}

        {loading && !product ? (
          <div className="detail-loading">Đang tải...</div>
        ) : !product ? (
          <div className="detail-empty">Không tìm thấy sản phẩm.</div>
        ) : (
          <>
            <div className="detail-grid">
              <div className="detail-left-col">
                <div className="detail-image-panel">
                  {activeMedia && isVideo(activeMedia) ? (
                    <video
                      className="detail-main-img"
                      src={activeMedia.url}
                      controls
                      autoPlay
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      className="detail-main-img"
                      src={activeMedia?.url}
                      alt={product.name}
                    />
                  )}

                  {images.length > 1 && (
                    <div className="detail-thumb-row">
                      {images.map((img, idx) => {
                        const activeClass = idx === activeImage ? "detail-thumb active" : "detail-thumb";

                        return isVideo(img) ? (
                          <button
                            key={img.key || img.url || idx}
                            type="button"
                            className={activeClass}
                            onClick={() => setActiveImage(idx)}
                          >
                            <video
                              src={img.url}
                              muted
                              playsInline
                              preload="metadata"
                              className="detail-thumb-video"
                            />
                            <span className="detail-video-icon">▶</span>
                          </button>
                        ) : (
                          <img
                            key={img.key || img.url || idx}
                            src={img.url}
                            alt={`${product.name} ${idx + 1}`}
                            className={activeClass}
                            onClick={() => setActiveImage(idx)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-info-panel">
                <div>
                  <div className="detail-brand">{product.brand || "Chưa có thương hiệu"}</div>
                  <h1 className="detail-name">{product.name}</h1>

                  {product.tags?.length > 0 && (
                    <div className="detail-tags-row">
                      {product.tags.map((t) => (
                        <span key={t} className="detail-tag-chip">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="detail-rating-row">
                  <span className="detail-stars">
                    {"★".repeat(Math.round(product.rating || 0)).padEnd(5, "☆")}
                  </span>
                  <span className="detail-rating-val">{(product.rating || 0).toFixed(1)}</span>
                  <span className="detail-sold">({product.totalReviews || 0} đánh giá)</span>
                  <span className="detail-sold">Đã bán {product.soldCount || 0}</span>
                </div>

                <div className="detail-price-box">
                  <span className="detail-price-main">
                    {priceLabel}
                  </span>

                  {hasDiscount && (
                    <>
                      <span className="detail-price-orig">{originalPrice.toLocaleString()} đ</span>
                      <span className="detail-discount-badge">-{discountPercent}%</span>
                    </>
                  )}
                </div>

                {coupons.length > 0 && (
                  <div className="detail-coupon-row">
                    {coupons.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="detail-coupon-chip"
                        onClick={() => handleCopyCoupon(c.code)}
                        title={
                          c.discountType === "PERCENT"
                            ? `Giảm ${c.discountValue}%`
                            : `Giảm ${c.discountValue?.toLocaleString()} đ`
                        }
                      >
                        🎟 {c.code}
                      </button>
                    ))}
                  </div>
                )}

                <div className="detail-divider" />

                <div className="detail-variants-section">
                  <h4>Phân loại {variant ? `đã chọn: ${variant.sku}` : "(vui lòng chọn)"}</h4>
                  {product.variants?.length ? (
                    <div className="variant-list">
                      {product.variants.map((item) => (
                        <button
                          key={item.sku}
                          type="button"
                          className={variant?.sku === item.sku ? "variant-item active" : "variant-item"}
                          onClick={() => {
                            setVariant(item);
                            setQty(1);
                          }}
                          disabled={item.active === false}
                        >
                          {item.color || "Màu"} / {item.size || "Kích cỡ"}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="detail-empty-small">Không có biến thể</div>
                  )}
                </div>

                <div className="detail-qty-row">
                  <label>Số lượng</label>
                  <div className="qty-control">
                    <button type="button" onClick={() => changeQty(-1)}>
                      −
                    </button>
                    <input type="number" value={qty} readOnly />
                    <button type="button" onClick={() => changeQty(1)}>
                      +
                    </button>
                  </div>
                  <span className="detail-stock">
                    {variant
                      ? variant.stock > 0
                        ? `Còn ${variant.stock} sản phẩm`
                        : "Hết hàng"
                      : "Chọn biến thể để xem tồn kho"}
                  </span>
                </div>

                <div className="detail-cta">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleAddToWishlist}
                    disabled={loading}
                  >
                    ♡ Yêu thích
                  </button>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleAddToCart}
                    disabled={loading || !variant || !variant.stock}
                  >
                    {loading ? "ĐANG XỬ LÝ..." : "Thêm vào giỏ hàng"}
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleBuyNow}
                    disabled={loading || !variant || !variant.stock}
                  >
                    Mua ngay
                  </button>
                </div>

                <div className="detail-divider" />

                <div className="detail-info-list">
                  <div className="detail-info-item">
                    <span className="label">Danh mục</span>
                    <span className="val">{categoryName || product.categoryId || "Chưa có"}</span>
                  </div>
                  <div className="detail-info-item">
                    <span className="label">Trạng thái</span>
                    <span className="val">{product.status || "Chưa rõ"}</span>
                  </div>
                  <div className="detail-info-item">
                    <span className="label">Lượt xem</span>
                    <span className="val">{product.viewCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {shop && (
              <div className="detail-shop-panel">
                <div className="detail-shop-main">
                  <img
                    className="detail-shop-logo"
                    src={shop.logo || "https://via.placeholder.com/80?text=Shop"}
                    alt={shop.shopName || "Shop"}
                    onClick={() => setShowShopDetail(true)}
                  />

                  <div className="detail-shop-info">
                    <div className="detail-shop-name" onClick={() => setShowShopDetail(true)}>
                      {shop.shopName || shop.name || "Shop"}
                    </div>

                    <div className="detail-shop-status">
                      {shop.status === "ACTIVE" ? "Đang hoạt động" : shop.status || "Chưa rõ"}
                    </div>

                    <div className="detail-shop-btns">
                      <button type="button" className="btn-primary" onClick={handleChatShop}>
                        💬 Chat ngay
                      </button>

                      <button type="button" className="btn-secondary" onClick={goToShop}>
                        🏬 Xem shop
                      </button>
                    </div>
                  </div>
                </div>

                <div className="detail-shop-stats" onClick={() => setShowShopDetail(true)}>
                  <div className="detail-shop-stat">
                    <div className="stat-label">Đánh giá</div>
                    <div className="stat-value">
                      {(shop.rating || 0).toFixed(1)} ({shop.totalReviews || 0})
                    </div>
                  </div>

                  <div className="detail-shop-stat">
                    <div className="stat-label">Đã bán</div>
                    <div className="stat-value">{shop.totalSales || 0}</div>
                  </div>

                  {shopJoinedLabel && (
                    <div className="detail-shop-stat">
                      <div className="stat-label">Tham gia</div>
                      <div className="stat-value">{shopJoinedLabel}</div>
                    </div>
                  )}

                  {shop.address?.province && (
                    <div className="detail-shop-stat">
                      <div className="stat-label">Địa chỉ</div>
                      <div className="stat-value">{shop.address.province}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="detail-desc-section">
              <div className="detail-tab-bar">
                <button
                  type="button"
                  className={tab === "desc" ? "detail-tab active" : "detail-tab"}
                  onClick={() => setTab("desc")}
                >
                  Mô tả sản phẩm
                </button>

                <button
                  type="button"
                  className={tab === "reviews" ? "detail-tab active" : "detail-tab"}
                  onClick={() => setTab("reviews")}
                >
                  Đánh giá ({reviews.length})
                </button>
              </div>

              <div className="detail-tab-body">
                {tab === "desc" ? (
                  product.description || "Không có mô tả sản phẩm."
                ) : (
                  <>
                    {ratingSummary && (
                      <div className="review-summary">
                        <div className="review-summary-score">
                          <div className="review-summary-avg">{(ratingSummary.avgRating || 0).toFixed(1)}</div>
                          <div className="detail-stars">
                            {"★".repeat(Math.round(ratingSummary.avgRating || 0)).padEnd(5, "☆")}
                          </div>
                          <div className="detail-sold">{ratingSummary.totalReviews || 0} đánh giá</div>
                        </div>

                        <div className="review-summary-bars">
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = ratingSummary.starBreakdown?.[star] || 0;
                            const percent = ratingSummary.totalReviews
                              ? Math.round((count / ratingSummary.totalReviews) * 100)
                              : 0;
                            return (
                              <div key={star} className="review-bar-row">
                                <span>{star} sao</span>
                                <div className="review-bar-track">
                                  <div className="review-bar-fill" style={{ width: `${percent}%` }} />
                                </div>
                                <span>{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {reviews.length ? (
                      <div className="detail-review-list">
                        {reviews.map((r) => (
                          <div key={r.id} className="detail-review-item">
                            <strong>{"★".repeat(r.rating)}</strong>
                            <p>{r.comment}</p>

                            {r.imageUrls?.length > 0 && (
                              <div className="detail-review-images">
                                {r.imageUrls.map((img, i) => (
                                  <img key={i} src={img} alt={`review-${i}`} />
                                ))}
                              </div>
                            )}

                            {r.shopReply?.content && (
                              <p className="detail-shop-reply">Phản hồi từ shop: {r.shopReply.content}</p>
                            )}

                            <button
                              type="button"
                              className="detail-helpful-btn"
                              onClick={() => handleMarkHelpful(r.id)}
                            >
                              👍 Hữu ích ({r.helpfulCount || 0})
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      "Chưa có đánh giá nào."
                    )}
                  </>
                )}
              </div>
            </div>

            {relatedProducts.length > 0 && (
              <div className="detail-related-section">
                <h4>Sản phẩm khác của shop</h4>
                <div className="detail-related-grid">
                  {relatedProducts.map((p) => (
                    <div
                      key={p.id || p._id}
                      className="detail-related-card"
                      onClick={() => goToProduct(p.id || p._id)}
                    >
                      <img
                        src={
                          p.images?.find((i) => i.isMain)?.url ||
                          p.images?.[0]?.url ||
                          "https://via.placeholder.com/200"
                        }
                        alt={p.name}
                      />
                      <div className="detail-related-name">{p.name}</div>
                      <div className="detail-related-price">{(p.basePrice || 0).toLocaleString()} đ</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showShopDetail && shop && (
        <div className="shop-detail-overlay" onClick={() => setShowShopDetail(false)}>
          <div className="shop-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="shop-detail-close"
              onClick={() => setShowShopDetail(false)}
              aria-label="Đóng"
            >
              ✕
            </button>

            <div className="shop-modal-head">
              <img
                src={shop.logo || "https://via.placeholder.com/80?text=Shop"}
                alt={shop.shopName || "Shop"}
              />
              <div>
                <h3>{shop.shopName || shop.name || "Shop"}</h3>
                <span>{shop.status === "ACTIVE" ? "Đang hoạt động" : shop.status || "Chưa rõ"}</span>
              </div>
            </div>

            <div className="shop-modal-grid">
              <div className="detail-info-item">
                <span className="label">Đánh giá</span>
                <span className="val">⭐ {(shop.rating || 0).toFixed(1)} ({shop.totalReviews || 0})</span>
              </div>

              <div className="detail-info-item">
                <span className="label">Đã bán</span>
                <span className="val">{shop.totalSales || 0}</span>
              </div>

              {shopJoinedLabel && (
                <div className="detail-info-item">
                  <span className="label">Tham gia</span>
                  <span className="val">{shopJoinedLabel}</span>
                </div>
              )}

              <div className="detail-info-item">
                <span className="label">Trạng thái</span>
                <span className="val">
                  {shop.status === "ACTIVE" ? "Đang hoạt động" : shop.status || "Chưa rõ"}
                </span>
              </div>
            </div>

            {shop.description && (
              <div className="shop-modal-section">
                <h4>Giới thiệu</h4>
                <p>{shop.description}</p>
              </div>
            )}

            <div className="shop-modal-section">
              <h4>Thông tin liên hệ</h4>
              {shop.address?.detail || shop.address?.province ? (
                <p>
                  📍{" "}
                  {[
                    shop.address?.fullName,
                    shop.address?.detail,
                    shop.address?.ward,
                    shop.address?.district,
                    shop.address?.province,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              ) : (
                <p className="shop-muted">Chưa có địa chỉ</p>
              )}

              {shop.phone && <p>📞 {shop.phone}</p>}
              {shop.email && <p>✉️ {shop.email}</p>}
            </div>

            <div className="shop-modal-actions">
              <button type="button" className="btn-primary" onClick={goToShop}>
                Xem tất cả sản phẩm
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowShopDetail(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}