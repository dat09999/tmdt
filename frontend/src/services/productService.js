import { API_BASE_URL, authFetch } from "../utils/auth";
import { safeFetch } from "./api";
import { MOCK_PRODUCTS } from "../mocks/mockProducts";
import { MOCK_CATEGORIES } from "../mocks/mockCategories";

export const productService = {
  // Lấy danh sách danh mục
  async getCategories() {
    return safeFetch(
      async () => {
        const res = await fetch(`${API_BASE_URL}/categories`);
        if (!res.ok) throw new Error("Fetch categories failed");
        return await res.json();
      },
      MOCK_CATEGORIES
    );
  },

  // Lấy danh sách tất cả sản phẩm
  async getProducts(params = {}) {
    const { category, search, sort } = params;
    return safeFetch(
      async () => {
        let url = `${API_BASE_URL}/products`;
        if (search) {
          url = `${API_BASE_URL}/products/search?keyword=${encodeURIComponent(search)}`;
        } else if (category) {
          url = `${API_BASE_URL}/products/category/${encodeURIComponent(category)}`;
        }
        const res = await authFetch(url);
        return Array.isArray(res) ? res : [];
      },
      // Filter mock products if backend is offline
      (() => {
        let list = [...MOCK_PRODUCTS];
        if (category) {
          list = list.filter((p) => p.categoryId === category);
        }
        if (search) {
          const q = search.toLowerCase();
          list = list.filter((p) => p.name.toLowerCase().includes(q));
        }
        if (sort === "price_asc") {
          list.sort((a, b) => a.basePrice - b.basePrice);
        } else if (sort === "price_desc") {
          list.sort((a, b) => b.basePrice - a.basePrice);
        } else if (sort === "sold") {
          list.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
        }
        return list;
      })()
    );
  },

  // Lấy chi tiết sản phẩm theo ID
  async getProductById(id) {
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/products/${id}`);
        return res;
      },
      MOCK_PRODUCTS.find((p) => p.id === id) || MOCK_PRODUCTS[0]
    );
  },

  // Lấy sản phẩm Flash Sale
  async getFlashSaleProducts() {
    return safeFetch(
      async () => {
        const res = await authFetch(`${API_BASE_URL}/products/flash-sale`);
        return Array.isArray(res) ? res : [];
      },
      MOCK_PRODUCTS.filter((p) => p.isFlashSale)
    );
  },
};
