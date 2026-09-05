import { API_BASE_URL, authFetch } from "../utils/auth";
import { safeFetch } from "./api";

export const userService = {
  // GET /api/users/{userId}
  async getUserProfile(userId) {
    if (!userId) return null;
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/api/users/${userId}`);
      },
      null
    );
  },

  // PUT /api/users/{userId}
  async updateUserProfile(userId, { fullName, phone, url }) {
    return safeFetch(
      async () => {
        return await authFetch(`${API_BASE_URL}/api/users/${userId}`, {
          method: "PUT",
          body: JSON.stringify({ fullName, phone, url }),
        });
      },
      { userId, fullName, phone, url }
    );
  },

  // PUT /api/users/{userId}/avatar
  async updateAvatar(userId, file) {
    const formData = new FormData();
    formData.append("file", file);

    return authFetch(`${API_BASE_URL}/api/users/${userId}/avatar`, {
      method: "PUT",
      body: formData,
    });
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
