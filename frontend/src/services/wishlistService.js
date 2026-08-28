import { API_BASE_URL, authFetch } from "../utils/auth";
import { safeFetch } from "./api";
import { MOCK_PRODUCTS } from "../mocks/mockProducts";

const WISHLIST_KEY = "domix_wishlist";

function getLocalWishlist() {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [MOCK_PRODUCTS[0], MOCK_PRODUCTS[1]];
  } catch {
    return [MOCK_PRODUCTS[0], MOCK_PRODUCTS[1]];
  }
}

function saveLocalWishlist(list) {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  } catch {}
}

export const wishlistService = {
  // GET /wishlist/{userId}
  async getWishlist(userId) {
    if (!userId) return getLocalWishlist();
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/wishlist/${userId}`);
        // Response format: { id, userId, items: [{ productId, productName, image, price, shopId }] }
        return Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : getLocalWishlist();
      },
      getLocalWishlist()
    );
  },

  // GET /wishlist/{userId}{productId}
  async isProductWishlisted(userId, productId) {
    if (!userId) return this.isWishlisted(productId);
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/wishlist/${userId}${productId}`);
      },
      this.isWishlisted(productId)
    );
  },

  // POST /wishlist - Add to wishlist
  async addToWishlist(userId, productId) {
    if (!userId) return;
    return safeFetch(async () => {
      return await authFetch(`${API_BASE_URL}/wishlist`, {
        method: "POST",
        body: JSON.stringify({ userId, productId }),
      });
    }, null);
  },

  // DELETE /wishlist/{userId}/item?productId=...
  async removeFromWishlist(userId, productId) {
    if (!userId) return;
    return safeFetch(async () => {
      return await authFetch(
        `${API_BASE_URL}/wishlist/${userId}/item?productId=${encodeURIComponent(productId)}`,
        { method: "DELETE" }
      );
    }, null);
  },

  // Local fallback toggle
  async toggleWishlist(userId, product) {
    const list = getLocalWishlist();
    const index = list.findIndex((p) => (p.id || p.productId) === (product.id || product.productId));
    let isAdded = false;

    if (index >= 0) {
      list.splice(index, 1);
      if (userId) {
        await this.removeFromWishlist(userId, product.id || product.productId);
      }
    } else {
      list.push(product);
      isAdded = true;
      if (userId) {
        await this.addToWishlist(userId, product.id || product.productId);
      }
    }
    saveLocalWishlist(list);
    return { list, isAdded };
  },

  isWishlisted(productId) {
    const list = getLocalWishlist();
    return list.some((p) => (p.id || p.productId) === productId);
  },
};
