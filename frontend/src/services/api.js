import { API_BASE_URL, authFetch, getAuthHeader } from "../utils/auth";

export { API_BASE_URL, authFetch, getAuthHeader };

/**
 * Safe fetch helper that gracefully falls back to mock data if backend API is not available
 */
export async function safeFetch(apiFn, fallbackData) {
  try {
    const data = await apiFn();
    if (data !== undefined && data !== null) {
      // If array expected and empty, return array; if object returned, return object
      return data;
    }
    return fallbackData;
  } catch (error) {
    console.warn("[API Service] Backend request failed, using mock data fallback:", error.message);
    return fallbackData;
  }
}
