import { API_BASE_URL, authFetch } from "../utils/auth";
import { safeFetch } from "./api";
import { MOCK_PRODUCTS } from "../mocks/mockProducts";
import { MOCK_CATEGORIES } from "../mocks/mockCategories";

export const productService = {
  // GET /categories - Lấy tất cả danh mục active
  async getCategories() {
    return safeFetch(
      async () => {
        const res = await fetch(`${API_BASE_URL}/categories`);
        if (!res.ok) throw new Error("Fetch categories failed");
        return await res.json();
      },
      MOCK_CATEGORIES
    );
  },

  // GET /categories/{parentId}/children - Lấy danh mục con
  async getCategoryChildren(parentId) {
    return safeFetch(async () => {
      const res = await fetch(`${API_BASE_URL}/categories/${parentId}/children`);
      if (!res.ok) throw new Error("Fetch category children failed");
      return await res.json();
    }, []);
  },

  // GET /products, /products/search, /products/category/{categoryId}
  async getProducts(params = {}) {
    const { category, search, tag, sort } = params;
    return safeFetch(
      async () => {
        let url = `${API_BASE_URL}/products`;
        if (search) {
          url = `${API_BASE_URL}/products/search?keyword=${encodeURIComponent(search)}${tag ? `&tag=${encodeURIComponent(tag)}` : ""}`;
        } else if (category) {
          url = `${API_BASE_URL}/products/category/${encodeURIComponent(category)}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error("Fetch products failed");
        const list = await res.json();
        return Array.isArray(list) ? list : [];
      },
      (() => {
        let list = [...MOCK_PRODUCTS];
        if (category) list = list.filter((p) => p.categoryId === category);
        if (search) {
          const q = search.toLowerCase();
          list = list.filter((p) => p.name.toLowerCase().includes(q));
        }
        if (sort === "price_asc") list.sort((a, b) => a.basePrice - b.basePrice);
        else if (sort === "price_desc") list.sort((a, b) => b.basePrice - a.basePrice);
        else if (sort === "sold") list.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
        return list;
      })()
    );
  },

  // GET /products/{productId} - Chi tiết sản phẩm
  async getProductById(productId) {
    return safeFetch(
      async () => {
        const res = await fetch(`${API_BASE_URL}/products/${productId}`);
        if (!res.ok) throw new Error("Fetch product detail failed");
        return await res.json();
      },
      MOCK_PRODUCTS.find((p) => p.id === productId) || MOCK_PRODUCTS[0]
    );
  },

  // GET /products/slug/{slug}
  async getProductBySlug(slug) {
    return safeFetch(async () => {
      const res = await fetch(`${API_BASE_URL}/products/slug/${slug}`);
      if (!res.ok) throw new Error("Fetch product by slug failed");
      return await res.json();
    }, null);
  },

  // GET /products/shop/{shopId} - Lấy sản phẩm của 1 shop
  async getProductsByShop(shopId) {
    return safeFetch(async () => {
      const res = await fetch(`${API_BASE_URL}/products/shop/${shopId}`);
      if (!res.ok) throw new Error("Fetch shop products failed");
      return await res.json();
    }, MOCK_PRODUCTS);
  },

  // GET /reviews/product/{productId}
  async getProductReviews(productId, page = 0, size = 10) {
    return safeFetch(async () => {
      const res = await fetch(`${API_BASE_URL}/reviews/product/${productId}?page=${page}&size=${size}`);
      if (!res.ok) throw new Error("Fetch reviews failed");
      const data = await res.json();
      const items = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
      return items.map((r) => ({
        id: r.id || `rev-${Date.now()}-${Math.random()}`,
        userId: r.userId || r.user?.id,
        userName: r.userName || r.user?.fullName || r.buyerName || "Khách Hàng DoMix",
        avatar: r.avatar || r.user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${r.userName || "user"}`,
        rating: Number(r.rating) || 5,
        content: r.comment || r.content || r.reviewText || "Sản phẩm rất tốt, giao hàng nhanh chóng!",
        variant: r.variantName || r.variantSku || r.variant || "Tiêu chuẩn",
        date: r.createdAt || r.date || new Date().toISOString(),
        images: r.images || r.imageUrls || [],
        helpfulCount: r.helpfulCount || r.likes || 0,
        shopReply: r.shopReply || r.reply || null,
      }));
    }, MOCK_PRODUCTS[0].reviews || []);
  },

  // GET /reviews/product/{productId}/summary
  async getProductRatingSummary(productId) {
    return safeFetch(async () => {
      const res = await fetch(`${API_BASE_URL}/reviews/product/${productId}/summary`);
      if (!res.ok) throw new Error("Fetch rating summary failed");
      return await res.json();
    }, {
      avgRating: 4.9,
      totalReviews: 840,
      starBreakdown: { "5": 720, "4": 90, "3": 20, "2": 5, "1": 5 },
    });
  },

  // POST /reviews - Tạo đánh giá sản phẩm
  async createReview(reviewPayload) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/reviews`, {
          method: "POST",
          body: JSON.stringify({
            productId: reviewPayload.productId,
            rating: Number(reviewPayload.rating) || 5,
            comment: reviewPayload.comment || reviewPayload.content || "",
            variantSku: reviewPayload.variantSku || "default",
            orderId: reviewPayload.orderId || null,
            images: reviewPayload.images || [],
            imageUrls: reviewPayload.images || [],
          }),
        });
      },
      {
        id: `rev-${Date.now()}`,
        ...reviewPayload,
        createdAt: new Date().toISOString(),
      }
    );
  },

  // POST /reviews/{reviewId}/helpful
  async markReviewHelpful(reviewId) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/reviews/${reviewId}/helpful`, {
          method: "POST",
        });
      },
      { success: true }
    );
  },

  // Flash sale products (lọc theo tag hoặc flash sale)
  async getFlashSaleProducts() {
    return safeFetch(
      async () => {
        const res = await fetch(`${API_BASE_URL}/products/search?tag=flash_sale`);
        if (!res.ok) throw new Error("Fetch flash sale failed");
        const list = await res.json();
        return Array.isArray(list) && list.length > 0 ? list : MOCK_PRODUCTS.filter((p) => p.isFlashSale);
      },
      MOCK_PRODUCTS.filter((p) => p.isFlashSale)
    );
  },
};
