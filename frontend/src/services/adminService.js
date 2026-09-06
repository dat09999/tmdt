import { API_BASE_URL, authFetch, safeFetch } from "./api";

export const adminService = {
  // ==========================================
  // 1. ANALYTICS & DASHBOARD
  // ==========================================
  getOverview: async () => {
    return authFetch(`${API_BASE_URL}/admin/analytics/overview`);
  },

  getRevenueAnalytics: async ({ startDate, endDate, days = 10 } = {}) => {
    const params = new URLSearchParams();
    if (startDate && endDate) {
      params.append("startDate", startDate);
      params.append("endDate", endDate);
    } else {
      params.append("days", days);
    }
    return authFetch(`${API_BASE_URL}/admin/analytics/revenue?${params.toString()}`);
  },

  getTopShops: async (limit = 5) => {
    return authFetch(`${API_BASE_URL}/admin/analytics/top-shops?limit=${limit}`);
  },

  getTopProducts: async (limit = 5) => {
    return authFetch(`${API_BASE_URL}/admin/analytics/top-products?limit=${limit}`);
  },

  getOrderStatusAnalytics: async () => {
    return authFetch(`${API_BASE_URL}/admin/analytics/order-status`);
  },

  // ==========================================
  // 2. USER MANAGEMENT
  // ==========================================
  getUsers: async ({ active, provider, keyword, page = 0, size = 10 } = {}) => {
    const params = new URLSearchParams();
    if (active !== undefined && active !== null && active !== "") {
      params.append("active", active);
    }
    if (provider && provider !== "ALL") {
      params.append("provider", provider);
    }
    if (keyword && keyword.trim()) {
      params.append("keyword", keyword.trim());
    }
    params.append("page", page);
    params.append("size", size);
    return authFetch(`${API_BASE_URL}/admin/users?${params.toString()}`);
  },

  updateUserStatus: async (userId, active) => {
    return authFetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    });
  },

  // ==========================================
  // 3. SHOP MANAGEMENT
  // ==========================================
  getShops: async ({ status, keyword, page = 0, size = 10 } = {}) => {
    const params = new URLSearchParams();
    if (status && status !== "ALL") {
      params.append("status", status);
    }
    if (keyword && keyword.trim()) {
      params.append("keyword", keyword.trim());
    }
    params.append("page", page);
    params.append("size", size);
    return authFetch(`${API_BASE_URL}/admin/shops?${params.toString()}`);
  },

  getShopById: async (shopId) => {
    return authFetch(`${API_BASE_URL}/admin/shops/${shopId}`);
  },

  updateShopStatus: async (shopId, status) => {
    return authFetch(`${API_BASE_URL}/admin/shops/${shopId}/status?status=${encodeURIComponent(status)}`, {
      method: "PATCH",
    });
  },

  approveShop: async (shopId) => {
    return authFetch(`${API_BASE_URL}/admin/shops/${shopId}/approve`, {
      method: "POST",
    });
  },

  suspendShop: async (shopId, reason = "Vi phạm quy chế sàn") => {
    return authFetch(`${API_BASE_URL}/admin/shops/${shopId}/suspend?reason=${encodeURIComponent(reason)}`, {
      method: "POST",
    });
  },

  // ==========================================
  // 4. ORDER MANAGEMENT
  // ==========================================
  getOrders: async ({ status, shopId, page = 0, size = 10 } = {}) => {
    const params = new URLSearchParams();
    if (status && status !== "ALL") {
      params.append("status", status);
    }
    if (shopId && shopId.trim()) {
      params.append("shopId", shopId.trim());
    }
    params.append("page", page);
    params.append("size", size);
    return authFetch(`${API_BASE_URL}/admin/orders?${params.toString()}`);
  },

  cancelExpiredOrders: async () => {
    return authFetch(`${API_BASE_URL}/admin/orders/cancel-expired`, {
      method: "POST",
    });
  },

  // ==========================================
  // 5. REFUND & RETURN MANAGEMENT
  // ==========================================
  getRefunds: async ({ status, page = 0, size = 10 } = {}) => {
    const params = new URLSearchParams();
    if (status && status !== "ALL") {
      params.append("status", status);
    }
    params.append("page", page);
    params.append("size", size);
    return authFetch(`${API_BASE_URL}/admin/refunds?${params.toString()}`);
  },

  updateRefundStatus: async (refundId, status, rejectReason = "") => {
    return authFetch(`${API_BASE_URL}/admin/refunds/${refundId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, rejectReason }),
    });
  },

  // ==========================================
  // 6. COUPON MANAGEMENT
  // ==========================================
  getCoupons: async ({ shopId, page = 0, size = 10 } = {}) => {
    const params = new URLSearchParams();
    if (shopId && shopId.trim()) {
      params.append("shopId", shopId.trim());
    }
    params.append("page", page);
    params.append("size", size);
    return authFetch(`${API_BASE_URL}/admin/coupons?${params.toString()}`);
  },

  // ==========================================
  // 7. REVIEW MODERATION
  // ==========================================
  getReviews: async ({ rating, productId, page = 0, size = 10 } = {}) => {
    const params = new URLSearchParams();
    if (rating) {
      params.append("rating", rating);
    }
    if (productId && productId.trim()) {
      params.append("productId", productId.trim());
    }
    params.append("page", page);
    params.append("size", size);
    return authFetch(`${API_BASE_URL}/admin/reviews?${params.toString()}`);
  },

  deleteReview: async (reviewId) => {
    return authFetch(`${API_BASE_URL}/admin/reviews/${reviewId}`, {
      method: "DELETE",
    });
  },

  // ==========================================
  // 8. BROADCAST NOTIFICATIONS
  // ==========================================
  broadcastNotification: async ({ title, message, type = "SYSTEM" }) => {
    return authFetch(`${API_BASE_URL}/admin/notifications/broadcast`, {
      method: "POST",
      body: JSON.stringify({ title, message, type }),
    });
  },

  // ==========================================
  // 9. PAYMENT RECONCILIATION
  // ==========================================
  getPaymentReconciliation: async ({ startDate, endDate } = {}) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return authFetch(`${API_BASE_URL}/admin/payments/reconciliation?${params.toString()}`);
  },

  // ==========================================
  // 10. CATEGORY MANAGEMENT
  // ==========================================
  getCategories: async () => {
    return fetch(`${API_BASE_URL}/categories`).then((r) => r.json());
  },

  createCategory: async (data) => {
    return authFetch(`${API_BASE_URL}/categories`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateCategory: async (id, data) => {
    return authFetch(`${API_BASE_URL}/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteCategory: async (id) => {
    return authFetch(`${API_BASE_URL}/categories/${id}`, {
      method: "DELETE",
    });
  },

  // ==========================================
  // 11. PLATFORM CONFIG / COMMISSION SETTING
  // ==========================================
  getCommissionConfig: async () => {
    return authFetch(`${API_BASE_URL}/admin/settings/commission`);
  },

  updateCommissionRate: async (rate) => {
    return authFetch(`${API_BASE_URL}/admin/settings/commission?rate=${encodeURIComponent(rate)}`, {
      method: "PUT",
    });
  },
};
