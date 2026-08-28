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
  // Lấy danh sách yêu cầu hoàn tiền
  async getRefunds() {
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/refunds`);
        return Array.isArray(res) ? res : [];
      },
      getLocalRefunds()
    );
  },

  // Tạo yêu cầu hoàn tiền mới
  async createRefund(payload) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/refunds`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      },
      (() => {
        const list = getLocalRefunds();
        const newRefund = {
          id: `ref-${Date.now()}`,
          refundCode: `REF-2026-${Math.floor(10000 + Math.random() * 90000)}`,
          createdAt: new Date().toISOString(),
          status: "PROCESSING",
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
};
