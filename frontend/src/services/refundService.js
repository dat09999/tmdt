import { API_BASE_URL, authFetch } from "../utils/auth";
import { safeFetch } from "./api";
import { MOCK_REFUNDS } from "../mocks/mockRefunds";

const REFUND_STORAGE_KEY = "domix_mock_refunds";

function getLocalRefunds() {
  try {
    const raw = localStorage.getItem(REFUND_STORAGE_KEY);
    return raw ? JSON.parse(raw) : MOCK_REFUNDS;
  } catch {
    return MOCK_REFUNDS;
  }
}

function saveLocalRefunds(refunds) {
  try {
    localStorage.setItem(REFUND_STORAGE_KEY, JSON.stringify(refunds));
  } catch {}
}

export const refundService = {
  // GET /refunds/user/{userId}?page=0&size=10
  async getRefunds(userId, page = 0, size = 10) {
    if (!userId) return getLocalRefunds();
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/refunds/user/${userId}?page=${page}&size=${size}`);
        if (Array.isArray(res?.content)) return res.content;
        return Array.isArray(res) ? res : getLocalRefunds();
      },
      getLocalRefunds()
    );
  },

  // GET /refunds/{refundId}
  async getRefundById(refundId) {
    return safeFetch(async () => {
      const res = await authFetch(`${API_BASE_URL}/refunds/${refundId}`);
      return res;
    }, MOCK_REFUNDS[0]);
  },

  // POST /refunds
  // Body: { orderId, userId, reason, type, images }
  async createRefund(payload) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/refunds`, {
          method: "POST",
          body: JSON.stringify({
            orderId: payload.orderId,
            userId: payload.userId,
            reason: payload.reason,
            type: payload.solution || payload.type || "REFUND_ONLY",
            images: payload.images || [],
          }),
        });
      },
      (() => {
        const list = getLocalRefunds();
        const newRefund = {
          id: `ref-${Date.now()}`,
          refundCode: `REF-2026-${Math.floor(10000 + Math.random() * 90000)}`,
          createdAt: new Date().toISOString(),
          status: "PENDING",
          statusLabel: "Shop đang xem xét",
          timeline: [
            {
              title: "Gửi yêu cầu hoàn tiền",
              time: new Date().toLocaleDateString("vi-VN") + " " + new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
              done: true,
              current: true,
            },
            { title: "Người bán đang kiểm tra bằng chứng", time: "Đang chờ", done: false },
            { title: "Chấp thuận hoàn tiền", time: "Đang chờ", done: false },
            { title: "Tiền hoàn về tài khoản", time: "Đang chờ", done: false },
          ],
          ...payload,
        };
        list.unshift(newRefund);
        saveLocalRefunds(list);
        return newRefund;
      })()
    );
  },

  // GET /refunds/shop/{shopId}?page=0&size=10
  async getShopRefunds(shopId, page = 0, size = 10) {
    return safeFetch(async () => {
      const res = await authFetch(`${API_BASE_URL}/refunds/shop/${encodeURIComponent(shopId)}?page=${page}&size=${size}`);
      if (Array.isArray(res?.content)) return res.content;
      return Array.isArray(res) ? res : [];
    }, []);
  },

  // PATCH /refunds/{refundId}/process?status=...&adminNote=...&resolvedBy=...
  async processRefund(refundId, { status, adminNote, resolvedBy }) {
    return safeFetch(async () => {
      return await authFetch(
        `${API_BASE_URL}/refunds/${refundId}/process?status=${encodeURIComponent(status)}&resolvedBy=${encodeURIComponent(resolvedBy || "shop")}${adminNote ? `&adminNote=${encodeURIComponent(adminNote)}` : ""}`,
        { method: "PATCH" }
      );
    }, null);
  },
};
