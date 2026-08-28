import { API_BASE_URL, authFetch } from "../utils/auth";
import { safeFetch } from "./api";

export const couponService = {
  // GET /coupons - Lấy danh sách mã giảm giá active
  async getActiveCoupons() {
    return safeFetch(async () => {
      const res = await fetch(`${API_BASE_URL}/coupons`);
      if (!res.ok) throw new Error("Fetch coupons failed");
      return await res.json();
    }, [
      { id: "c-1", code: "DOMIX50K", discountValue: 50000, discountType: "FIXED", minOrderValue: 300000 },
      { id: "c-2", code: "FREESHIP", discountValue: 25000, discountType: "FIXED", minOrderValue: 50000 },
    ]);
  },

  // GET /coupons/shop/{shopId}
  async getShopCoupons(shopId) {
    return safeFetch(async () => {
      const res = await fetch(`${API_BASE_URL}/coupons/shop/${shopId}`);
      if (!res.ok) throw new Error("Fetch shop coupons failed");
      return await res.json();
    }, []);
  },

  // GET /coupons/validate?code=...&orderValue=...
  async validateCoupon(code, orderValue) {
    return safeFetch(async () => {
      const res = await fetch(
        `${API_BASE_URL}/coupons/validate?code=${encodeURIComponent(code)}&orderValue=${orderValue}`
      );
      if (!res.ok) throw new Error("Mã giảm giá không hợp lệ hoặc chưa đạt đơn tối thiểu");
      return await res.json();
    }, {
      code,
      discountValue: code.toUpperCase() === "DOMIX50K" ? 50000 : code.toUpperCase() === "FREESHIP" ? 25000 : 0,
      active: true,
    });
  },
};
