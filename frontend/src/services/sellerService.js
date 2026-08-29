import { API_BASE_URL, authFetch } from "../utils/auth";
import { safeFetch } from "./api";
import { MOCK_PRODUCTS } from "../mocks/mockProducts";
import { MOCK_ORDERS } from "../mocks/mockOrders";

export const sellerService = {
  // GET /shops/owner/{ownerId}
  async getShopByOwnerId(ownerId) {
    if (!ownerId) return null;
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/shops/owner/${ownerId}`);
      },
      null
    );
  },

  // POST /shops - Body: CreateShopRequest
  async createShop(shopData) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/shops`, {
          method: "POST",
          body: JSON.stringify(shopData),
        });
      },
      { id: `shop-${Date.now()}`, ...shopData }
    );
  },

  // GET /shops/{shopId}/statistics
  async getDashboardStats(shopId) {
    if (!shopId) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        outOfStockProducts: 0,
        totalProducts: 0,
        rating: 5.0,
        responseRate: "100%",
      };
    }
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/shops/${shopId}/statistics`);
        return {
          totalRevenue: res?.revenue ?? 0,
          totalOrders: res?.orderCount ?? 0,
          pendingOrders: res?.pendingCount ?? 0,
          outOfStockProducts: res?.outOfStockCount ?? 0,
          totalProducts: res?.productCount ?? 0,
          rating: res?.averageRating ?? 5.0,
          responseRate: "99%",
        };
      },
      {
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        outOfStockProducts: 0,
        totalProducts: 0,
        rating: 5.0,
        responseRate: "100%",
      }
    );
  },

  // GET /products/shop/{shopId}?page=0&size=12
  async getProducts(shopId, page = 0, size = 12) {
    return safeFetch(
      async () => {
        const url = shopId
          ? `${API_BASE_URL}/products/shop/${encodeURIComponent(shopId)}?page=${page}&size=${size}`
          : `${API_BASE_URL}/products?page=${page}&size=${size}`;
        const res = await authFetch(url);
        if (Array.isArray(res?.content)) return res.content;
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.products)) return res.products;
        return [];
      },
      []
    );
  },

  // POST /products - Body: CreateProductRequest
  async createProduct(shopId, productData) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/products`, {
          method: "POST",
          body: JSON.stringify({ shopId, ...productData }),
        });
      },
      { id: `sp-${Date.now()}`, ...productData }
    );
  },

  // PUT /products/{productId} - Body: CreateProductRequest
  async updateProduct(shopId, productId, productData) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/products/${productId}`, {
          method: "PUT",
          body: JSON.stringify({ shopId, ...productData }),
        });
      },
      { id: productId, ...productData }
    );
  },

  // DELETE /products/{productId}
  async deleteProduct(shopId, productId) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/products/${productId}`, {
          method: "DELETE",
        });
      },
      { success: true }
    );
  },

  // GET /orders/shop/{shopId}?page=0&size=10
  async getOrders(shopId, page = 0, size = 10) {
    if (!shopId) return [];
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/orders/shop/${encodeURIComponent(shopId)}?page=${page}&size=${size}`);
        if (Array.isArray(res?.content)) return res.content;
        return Array.isArray(res) ? res : [];
      },
      []
    );
  },

  // PATCH /orders/{orderId}/status - Body: { status, updatedBy, note }
  async updateOrderStatus(shopId, orderId, status) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/orders/${orderId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status, updatedBy: "seller", note: "Cập nhật từ Seller Center" }),
        });
      },
      { success: true, status }
    );
  },

  // PATCH /orders/{orderId}/shipping - Body: { shippingProvider, trackingCode, note }
  async startShipping(orderId, shippingData) {
    return safeFetch(async () => {
      return await authFetch(`${API_BASE_URL}/orders/${orderId}/shipping`, {
        method: "PATCH",
        body: JSON.stringify(shippingData),
      });
    }, null);
  },

  // GET /coupons/shop/{shopId}
  async getCoupons(shopId) {
    if (!shopId) return [];
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/coupons/shop/${shopId}`);
        return Array.isArray(res) ? res : [];
      },
      []
    );
  },

  // POST /coupons - Body: CreateCouponRequest
  async createCoupon(shopId, couponData) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/coupons`, {
          method: "POST",
          body: JSON.stringify({ shopId, ...couponData }),
        });
      },
      { id: `c-${Date.now()}`, ...couponData }
    );
  },
};
