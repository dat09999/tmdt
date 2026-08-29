import { API_BASE_URL, authFetch } from "../utils/auth";
import { safeFetch } from "./api";
import { MOCK_ORDERS } from "../mocks/mockOrders";

export const orderService = {
  // GET /orders/buyer/{buyerId}?page=0&size=10
  async getBuyerOrders(buyerId, page = 0, size = 10) {
    if (!buyerId) return [];
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/orders/buyer/${buyerId}?page=${page}&size=${size}`);
        if (Array.isArray(res?.content)) return res.content;
        return Array.isArray(res) ? res : [];
      },
      []
    );
  },

  // Check if buyer has purchased and received product
  async checkCanReviewProduct(userId, productId) {
    if (!userId) return { canReview: false, reason: "NOT_LOGGED_IN" };
    if (!productId) return { canReview: false, reason: "NOT_PURCHASED" };

    try {
      const orders = await this.getBuyerOrders(userId);
      const deliveredOrder = orders.find((o) => {
        const isDelivered = ["DELIVERED", "COMPLETED"].includes((o.orderStatus || "").toUpperCase());
        const hasProduct = (o.items || []).some(
          (it) => it.productId === productId || it.id === productId || String(it.productId) === String(productId)
        );
        return isDelivered && hasProduct;
      });

      if (deliveredOrder) {
        const matchedItem = deliveredOrder.items.find(
          (it) => it.productId === productId || it.id === productId || String(it.productId) === String(productId)
        );
        return {
          canReview: true,
          orderId: deliveredOrder.id,
          variantName: matchedItem?.variantName || matchedItem?.variantSku || "Tiêu chuẩn",
        };
      }

      const pendingOrder = orders.find((o) =>
        (o.items || []).some(
          (it) => it.productId === productId || it.id === productId || String(it.productId) === String(productId)
        )
      );

      if (pendingOrder) {
        return { canReview: false, reason: "ORDER_NOT_DELIVERED_YET" };
      }

      return { canReview: false, reason: "NOT_PURCHASED" };
    } catch {
      return { canReview: false, reason: "NOT_PURCHASED" };
    }
  },

  // GET /orders/{orderId}
  async getOrderById(orderId) {
    if (!orderId) return null;
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/orders/${orderId}`);
        return res;
      },
      null
    );
  },

  // POST /orders/from-cart
  // Body: { buyerId, shippingAddress: { fullName, phone, province, district, ward, detail }, selectedItems: [{ productId, variantSku }], couponCode, note, paymentMethod }
  async createOrderFromCart(orderPayload) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/orders/from-cart`, {
          method: "POST",
          body: JSON.stringify(orderPayload),
        });
      },
      [
        {
          id: `ord-${Date.now()}`,
          orderCode: `DOMIX${Date.now().toString().slice(-6)}`,
          createdAt: new Date().toISOString(),
          orderStatus: "PENDING",
          ...orderPayload,
        },
      ]
    );
  },

  // POST /orders/buy-now
  // Body: { buyerId, productId, variantSku, quantity, shippingAddress, note, couponCode, paymentMethod }
  async buyNow(buyNowPayload) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/orders/buy-now`, {
          method: "POST",
          body: JSON.stringify(buyNowPayload),
        });
      },
      {
        id: `ord-${Date.now()}`,
        orderCode: `DOMIX${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
        orderStatus: "PENDING",
        ...buyNowPayload,
      }
    );
  },

  // POST /api/payment/vnpay/create/{orderId}
  async createVNPayUrl(orderId) {
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/api/payment/vnpay/create/${orderId}`, {
          method: "POST",
        });
        return res?.paymentUrl || res?.url || Object.values(res || {})[0];
      },
      `/payment/vnpay-result?vnp_ResponseCode=00&vnp_TxnRef=${orderId}&vnp_Amount=2999000000`
    );
  },

  // PATCH /orders/{orderId}/cancel
  // Body: { canceledBy, reason }
  async cancelOrder(orderId, reason = "Khách hàng hủy đơn", canceledBy = "buyer") {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
          method: "PATCH",
          body: JSON.stringify({ canceledBy, reason }),
        });
      },
      { success: true, message: "Đã hủy đơn hàng thành công" }
    );
  },

  // PATCH /orders/payment/success
  async markPaymentSuccess(orderCode, transactionCode) {
    return safeFetch(async () => {
      return await authFetch(`${API_BASE_URL}/orders/payment/success`, {
        method: "PATCH",
        body: JSON.stringify({ orderCode, transactionCode }),
      });
    }, null);
  },
};
