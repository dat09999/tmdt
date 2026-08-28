import { API_BASE_URL, authFetch } from "../utils/auth";
import { safeFetch } from "./api";
import { MOCK_ORDERS } from "../mocks/mockOrders";

export const orderService = {
  // Lấy danh sách đơn hàng của người mua
  async getBuyerOrders(userId) {
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/orders/buyer/${userId}`);
        return Array.isArray(res) ? res : [];
      },
      MOCK_ORDERS
    );
  },

  // Lấy chi tiết 1 đơn hàng
  async getOrderById(orderId) {
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/orders/${orderId}`);
        return res;
      },
      MOCK_ORDERS.find((o) => o.id === orderId || o.orderCode === orderId) || MOCK_ORDERS[0]
    );
  },

  // Tạo đơn hàng mới
  async createOrder(orderPayload) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/orders`, {
          method: "POST",
          body: JSON.stringify(orderPayload),
        });
      },
      {
        id: `ord-${Date.now()}`,
        orderCode: `DOMIX${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
        orderStatus: "PENDING",
        ...orderPayload,
      }
    );
  },

  // Tạo URL thanh toán VNPAY
  async createVNPayUrl(orderId, amount) {
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/payment/create-vnpay-url`, {
          method: "POST",
          body: JSON.stringify({ orderId, amount }),
        });
        return res?.paymentUrl || res?.url;
      },
      // Mock fallback redirect to success result
      `/payment/vnpay-result?vnp_ResponseCode=00&vnp_TxnRef=${orderId}&vnp_Amount=${amount * 100}`
    );
  },

  // Hủy đơn hàng
  async cancelOrder(orderId, reason = "") {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
          method: "PUT",
          body: JSON.stringify({ reason }),
        });
      },
      { success: true, message: "Đã hủy đơn hàng thành công" }
    );
  },
};
