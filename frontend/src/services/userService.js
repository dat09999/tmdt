import { API_BASE_URL, authFetch } from "../utils/auth";
import { safeFetch } from "./api";

export const userService = {
  // GET /api/users/{userId}
  async getUserProfile(userId) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/api/users/${userId}`);
      },
      {
        userId,
        fullName: "Nguyễn Minh Khang",
        email: "khang.nguyen@example.com",
        phone: "0912 345 678",
        address: [
          {
            id: "addr-1",
            fullName: "Nguyễn Minh Khang",
            phone: "0912 345 678",
            detail: "Số 88 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
            isDefault: true,
          },
        ],
      }
    );
  },

  // PUT /api/users/{userId}
  async updateUserProfile(userId, { fullName, phone }) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/api/users/${userId}`, {
          method: "PUT",
          body: JSON.stringify({ fullName, phone }),
        });
      },
      { userId, fullName, phone }
    );
  },

  // PUT /api/users/{userId}/password
  async changePassword(userId, { currentPassword, newPassword }) {
    return authFetch(`${API_BASE_URL}/api/users/${userId}/password`, {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // POST /api/users/{userId}/addresses
  async addAddress(userId, addressData) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/api/users/${userId}/addresses`, {
          method: "POST",
          body: JSON.stringify(addressData),
        });
      },
      { success: true }
    );
  },

  // PUT /api/users/{userId}/addresses/{addressId}
  async updateAddress(userId, addressId, addressData) {
    return safeFetch(
      async () => {
        return await authFetch(
          `${API_BASE_URL}/api/users/${userId}/addresses/${addressId}`,
          {
            method: "PUT",
            body: JSON.stringify(addressData),
          }
        );
      },
      { success: true }
    );
  },

  // DELETE /api/users/{userId}/addresses/{addressId}
  async deleteAddress(userId, addressId) {
    return safeFetch(
      async () => {
        return await authFetch(
          `${API_BASE_URL}/api/users/${userId}/addresses/${addressId}`,
          {
            method: "DELETE",
          }
        );
      },
      { success: true }
    );
  },

  // GET /api/geo/suggest?input=...
  async getAddressSuggestions(input) {
    return safeFetch(async () => {
      const res = await fetch(
        `${API_BASE_URL}/api/geo/suggest?input=${encodeURIComponent(input)}`
      );
      if (!res.ok) throw new Error("Fetch geo suggestions failed");
      return await res.json();
    }, []);
  },

  // GET /api/geo/resolve?placeId=...
  async resolvePlace(placeId) {
    return safeFetch(async () => {
      const res = await fetch(
        `${API_BASE_URL}/api/geo/resolve?placeId=${encodeURIComponent(placeId)}`
      );
      if (!res.ok) throw new Error("Resolve place failed");
      return await res.json();
    }, null);
  },
};
