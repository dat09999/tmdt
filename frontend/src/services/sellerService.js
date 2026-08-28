import { API_BASE_URL, authFetch } from "../utils/auth";
import { safeFetch } from "./api";
import { MOCK_PRODUCTS } from "../mocks/mockProducts";
import { MOCK_ORDERS } from "../mocks/mockOrders";

export const sellerService = {
  // GET /shops/owner/{ownerId}
  async getShopByOwnerId(ownerId) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/shops/owner/${ownerId}`);
      },
      {
        id: "shop-apple-official",
        shopName: "Apple Flagship Store",
        ownerId,
        rating: 4.9,
      }
    );
  },

  // GET /shops/{shopId}/statistics
  async getDashboardStats(shopId) {
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/shops/${shopId}/statistics`);
        return {
          totalRevenue: res?.revenue || 128450000,
          totalOrders: res?.orderCount || 320,
          pendingOrders: 14,
          outOfStockProducts: 3,
          totalProducts: res?.productCount || 48,
          rating: res?.averageRating || 4.9,
          responseRate: "99%",
        };
      },
      {
        totalRevenue: 128450000,
        totalOrders: 320,
        pendingOrders: 14,
        outOfStockProducts: 3,
        totalProducts: 48,
        rating: 4.9,
        responseRate: "99%",
      }
    );
  },

  // GET /products/shop/{shopId}
  async getProducts(shopId) {
    return safeFetch(
      async () => {
        const res = await fetch(`${API_BASE_URL}/products/shop/${shopId}`);
        if (!res.ok) throw new Error("Fetch shop products failed");
        return await res.json();
      },
      MOCK_PRODUCTS
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

  // GET /orders/shop/{shopId}
  async getOrders(shopId) {
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/orders/shop/${shopId}`);
        return Array.isArray(res) ? res : [];
      },
      MOCK_ORDERS
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
    return safeFetch(
      async () => {
        const res = await fetch(`${API_BASE_URL}/coupons/shop/${shopId}`);
        if (!res.ok) throw new Error("Fetch coupons failed");
        return await res.json();
      },
      [
        { id: "c-1", code: "SHOP50K", discountValue: 50000, discountType: "FIXED", minOrderValue: 300000, expiry: "2026-12-31", usedCount: 45 },
        { id: "c-2", code: "FREESHIP", discountValue: 25000, discountType: "FIXED", minOrderValue: 150000, expiry: "2026-12-31", usedCount: 120 },
      ]
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
      { id: `c-${Date.now()}`, ...couponData, usedCount: 0 }
    );
  },

  // PATCH /coupons/{couponId}/deactivate
  async deactivateCoupon(couponId) {
    return safeFetch(async () => {
      return await authFetch(`${API_BASE_URL}/coupons/${couponId}/deactivate`, {
        method: "PATCH",
      });
    }, null);
  },

  // POST /shops & PUT /shops/{shopId}
  async saveShopInfo(shopId, shopData) {
    const method = shopId ? "PUT" : "POST";
    const url = shopId ? `${API_BASE_URL}/shops/${shopId}` : `${API_BASE_URL}/shops`;
    return safeFetch(async () => {
      return await authFetch(url, {
        method,
        body: JSON.stringify(shopData),
      });
    }, shopData);
  },
};
