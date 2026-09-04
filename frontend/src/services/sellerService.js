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

  // GET /shops/{shopId}/analytics/overview?startDate=...&endDate=... OR ?days=10
  async getAnalyticsOverview(shopId, params = 10) {
    if (!shopId) return null;
    let query = "days=10";
    if (typeof params === "object" && params !== null) {
      if (params.startDate && params.endDate) {
        query = `startDate=${encodeURIComponent(params.startDate)}&endDate=${encodeURIComponent(params.endDate)}`;
      } else if (params.days) {
        query = `days=${params.days}`;
      }
    } else if (params) {
      query = `days=${params}`;
    }

    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/shops/${shopId}/analytics/overview?${query}`);
        return res;
      },
      {
        summary: {
          shopId,
          productCount: 24,
          orderCount: 158,
          totalSales: 340,
          averageRating: 4.85,
          revenue: 52400000,
        },
        revenueChart: [
          { date: "2026-08-01", revenue: 1500000, orderCount: 4 },
          { date: "2026-08-02", revenue: 2200000, orderCount: 7 },
          { date: "2026-08-03", revenue: 800000,  orderCount: 3 },
          { date: "2026-08-04", revenue: 0,       orderCount: 0 },
          { date: "2026-08-05", revenue: 3400000, orderCount: 9 },
          { date: "2026-08-06", revenue: 1900000, orderCount: 6 },
          { date: "2026-08-07", revenue: 2700000, orderCount: 8 },
          { date: "2026-08-08", revenue: 4500000, orderCount: 14 },
          { date: "2026-08-09", revenue: 3800000, orderCount: 11 },
          { date: "2026-08-10", revenue: 5100000, orderCount: 15 },
        ],
        orderStatusDistribution: {
          statusCounts: {
            PENDING: 4,
            PROCESSING: 8,
            SHIPPING: 15,
            COMPLETED: 125,
            CANCELED: 5,
            REFUNDED: 1,
          },
          totalOrders: 158,
        },
        topProducts: [
          {
            productId: "p-1",
            productName: "Áo Thun Unisex Cotton 100% Form Rộng",
            imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100",
            basePrice: 199000,
            soldCount: 85,
            revenue: 16915000,
          },
          {
            productId: "p-2",
            productName: "Quần Jean Baggy Nam Nữ Ống Rộng",
            imageUrl: "https://images.unsplash.com/photo-1542272604-780c96856592?w=100",
            basePrice: 350000,
            soldCount: 42,
            revenue: 14700000,
          },
        ],
        lowStockAlerts: [
          {
            productId: "p-1",
            productName: "Áo Thun Unisex Cotton 100% Form Rộng",
            sku: "AT-DEN-XL",
            color: "Đen",
            size: "XL",
            stock: 2,
          },
          {
            productId: "p-2",
            productName: "Quần Jean Baggy Nam Nữ Ống Rộng",
            sku: "QJ-XANH-M",
            color: "Xanh nhạt",
            size: "M",
            stock: 0,
          },
        ],
      }
    );
  },

  // GET /shops/{shopId}/analytics/revenue?startDate=...&endDate=... OR ?days=10
  async getRevenueChart(shopId, params = 10) {
    if (!shopId) return [];
    let query = "days=10";
    if (typeof params === "object" && params !== null) {
      if (params.startDate && params.endDate) {
        query = `startDate=${encodeURIComponent(params.startDate)}&endDate=${encodeURIComponent(params.endDate)}`;
      } else if (params.days) {
        query = `days=${params.days}`;
      }
    } else if (params) {
      query = `days=${params}`;
    }

    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/shops/${shopId}/analytics/revenue?${query}`);
        return Array.isArray(res) ? res : [];
      },
      []
    );
  },

  // GET /shops/{shopId}/analytics/order-status
  async getOrderStatusDistribution(shopId) {
    if (!shopId) return null;
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/shops/${shopId}/analytics/order-status`);
      },
      null
    );
  },

  // GET /shops/{shopId}/analytics/top-products?limit=5
  async getTopProducts(shopId, limit = 5) {
    if (!shopId) return [];
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/shops/${shopId}/analytics/top-products?limit=${limit}`);
        return Array.isArray(res) ? res : [];
      },
      []
    );
  },

  // GET /shops/{shopId}/analytics/low-stock?threshold=5
  async getLowStockAlerts(shopId, threshold = 5) {
    if (!shopId) return [];
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/shops/${shopId}/analytics/low-stock?threshold=${threshold}`);
        return Array.isArray(res) ? res : [];
      },
      []
    );
  },

  // GET /shops/{shopId}/statistics (Legacy support)
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
