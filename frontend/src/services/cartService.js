import { API_BASE_URL, authFetch } from "../utils/auth";
import { safeFetch } from "./api";

// Local storage fallback key for cart if offline
const CART_STORAGE_KEY = "domix_local_cart";

function getLocalCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { items: [] };
  } catch {
    return { items: [] };
  }
}

function saveLocalCart(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {}
}

export const cartService = {
  // Lấy giỏ hàng của user
  async getCart(userId) {
    if (!userId) return getLocalCart();
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/cart/${userId}`);
        return res;
      },
      getLocalCart()
    );
  },

  // Thêm sản phẩm vào giỏ
  async addToCart(userId, item) {
    if (!userId) {
      const cart = getLocalCart();
      const existing = cart.items.find(
        (i) => i.productId === item.productId && i.variantSku === item.variantSku
      );
      if (existing) {
        existing.quantity += item.quantity || 1;
      } else {
        cart.items.push(item);
      }
      saveLocalCart(cart);
      return cart;
    }

    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/cart/${userId}/item`, {
          method: "POST",
          body: JSON.stringify(item),
        });
      },
      (() => {
        const cart = getLocalCart();
        cart.items.push(item);
        saveLocalCart(cart);
        return cart;
      })()
    );
  },

  // Cập nhật số lượng
  async updateQuantity(userId, { productId, variantSku, quantity }) {
    if (!userId) {
      const cart = getLocalCart();
      const it = cart.items.find(
        (i) => i.productId === productId && i.variantSku === variantSku
      );
      if (it) it.quantity = quantity;
      saveLocalCart(cart);
      return cart;
    }

    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/cart/${userId}/item`, {
          method: "PUT",
          body: JSON.stringify({ productId, variantSku, quantity }),
        });
      },
      getLocalCart()
    );
  },

  // Xóa sản phẩm khỏi giỏ
  async removeItem(userId, item) {
    if (!userId) {
      const cart = getLocalCart();
      cart.items = cart.items.filter(
        (i) => !(i.productId === item.productId && i.variantSku === item.variantSku)
      );
      saveLocalCart(cart);
      return cart;
    }

    return safeFetch(
      async () => {
        return await authFetch(
          `${API_BASE_URL}/cart/${userId}/item?productId=${encodeURIComponent(
            item.productId
          )}&variantSku=${encodeURIComponent(item.variantSku || "")}`,
          { method: "DELETE" }
        );
      },
      getLocalCart()
    );
  },
};
