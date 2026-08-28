import { API_BASE_URL, authFetch } from "../utils/auth";
import { safeFetch } from "./api";
import { MOCK_PRODUCTS } from "../mocks/mockProducts";
import { MOCK_ORDERS } from "../mocks/mockOrders";

export const sellerService = {
  // Lấy thống kê của shop
  async getDashboardStats(shopId) {
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/seller/${shopId}/stats`);
        return res;
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

  // Lấy danh sách sản phẩm của shop
  async getProducts(shopId) {
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/seller/${shopId}/products`);
        return Array.isArray(res) ? res : [];
      },
      MOCK_PRODUCTS
    );
  },

  // Thêm sản phẩm mới
  async createProduct(shopId, productData) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/seller/${shopId}/products`, {
          method: "POST",
          body: JSON.stringify(productData),
        });
      },
      { id: `sp-${Date.now()}`, ...productData }
    );
  },

  // Cập nhật sản phẩm
  async updateProduct(shopId, productId, productData) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/seller/${shopId}/products/${productId}`, {
          method: "PUT",
          body: JSON.stringify(productData),
        });
      },
      { id: productId, ...productData }
    );
  },

  // Xóa sản phẩm
  async deleteProduct(shopId, productId) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/seller/${shopId}/products/${productId}`, {
          method: "DELETE",
        });
      },
      { success: true }
    );
  },

  // Lấy danh sách đơn hàng của shop
  async getOrders(shopId) {
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/seller/${shopId}/orders`);
        return Array.isArray(res) ? res : [];
      },
      MOCK_ORDERS
    );
  },

  // Cập nhật trạng thái đơn hàng (xác nhận, giao hàng)
  async updateOrderStatus(shopId, orderId, status) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/seller/${shopId}/orders/${orderId}/status`, {
          method: "PUT",
          body: JSON.stringify({ status }),
        });
      },
      { success: true, status }
    );
  },

  // Lấy danh sách coupon của shop
  async getCoupons(shopId) {
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/seller/${shopId}/coupons`);
        return Array.isArray(res) ? res : [];
      },
      [
        { id: "c-1", code: "SHOP50K", discount: 50000, minOrder: 300000, expiry: "2026-12-31", usageCount: 45 },
        { id: "c-2", code: "FREESHIP", discount: 25000, minOrder: 150000, expiry: "2026-12-31", usageCount: 120 },
      ]
    );
  },

  // Tạo coupon shop
  async createCoupon(shopId, couponData) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/seller/${shopId}/coupons`, {
          method: "POST",
          body: JSON.stringify(couponData),
        });
      },
      { id: `c-${Date.now()}`, ...couponData, usageCount: 0 }
    );
  },
};
