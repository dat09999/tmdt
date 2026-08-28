import { API_BASE_URL, authFetch } from "../utils/auth";
import { safeFetch } from "./api";
import { MOCK_ORDERS } from "../mocks/mockOrders";

export const orderService = {
  // GET /orders/buyer/{buyerId}
  async getBuyerOrders(buyerId) {
    if (!buyerId) return MOCK_ORDERS;
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/orders/buyer/${buyerId}`);
        return Array.isArray(res) ? res : [];
      },
      MOCK_ORDERS
    );
  },

  // GET /orders/{orderId}
  async getOrderById(orderId) {
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/orders/${orderId}`);
        return res;
      },
      MOCK_ORDERS.find((o) => o.id === orderId || o.orderCode === orderId) || MOCK_ORDERS[0]
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
