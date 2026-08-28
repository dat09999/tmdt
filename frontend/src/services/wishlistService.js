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
  // Lấy danh sách sản phẩm yêu thích
  async getWishlist(userId) {
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/wishlist/${userId}`);
        return Array.isArray(res) ? res : [];
      },
      getLocalWishlist()
    );
  },

  // Thêm hoặc xóa khỏi yêu thích
  async toggleWishlist(userId, product) {
    const list = getLocalWishlist();
    const index = list.findIndex((p) => p.id === product.id);
    let isAdded = false;

    if (index >= 0) {
      list.splice(index, 1);
    } else {
      list.push(product);
      isAdded = true;
    }
    saveLocalWishlist(list);

    if (userId) {
      safeFetch(async () => {
        return await authFetch(`${API_BASE_URL}/wishlist/${userId}/toggle`, {
          method: "POST",
          body: JSON.stringify({ productId: product.id }),
        });
      }, null);
    }

    return { list, isAdded };
  },

  // Kiểm tra sản phẩm có trong wishlist không
  isWishlisted(productId) {
    const list = getLocalWishlist();
    return list.some((p) => p.id === productId);
  },
};
