export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080";

export function toFullImageUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;
  // Convert old localhost:9000 presigned urls from MinIO
  if (trimmed.includes(":9000/")) {
    const afterPort = trimmed.split(":9000/")[1]?.split("?")[0];
    if (afterPort) return `${API_BASE_URL}/api/files/${afterPort}`;
  }
  if (trimmed.startsWith("user/")) {
    return `${API_BASE_URL}/api/files/user-images/${trimmed}`;
  }
  if (trimmed.startsWith("/")) {
    return `${API_BASE_URL}${trimmed}`;
  }
  return trimmed;
}

const PROFILE_STORAGE_KEY = "domix_user_profile";

// Load cached non-sensitive user profile on startup (for smooth UI rendering)
function getCachedProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Access Token is STRICTLY IN-MEMORY ONLY (Never stored in localStorage/sessionStorage)
let accessToken = null;
let currentUser = getCachedProfile();

const listeners = new Set();

function notify() {
  listeners.forEach((callback) =>
    callback({ accessToken, user: currentUser })
  );
}

export function onAuthChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function setSession(data) {
  // 1. Token chỉ lưu trong RAM (In-Memory)
  if (data?.accessToken || data?.token) {
    accessToken = data.accessToken || data.token;
  }

  // 2. Thông tin profile thông thường (Tên, email, role, avatar) lưu vào cache để UI mượt
  const prevUser = currentUser || getCachedProfile();
  const profileInfo =
    data?.user ||
    (data?.userId || data?.email || data?.avatar || data?.url
      ? {
          userId: data.userId || prevUser?.userId,
          email: data.email || prevUser?.email,
          fullName: data.fullName || data.name || prevUser?.fullName || prevUser?.name,
          phone: data.phone || data.phoneNumber || prevUser?.phone || prevUser?.phoneNumber,
          role: data.role || prevUser?.role,
          address: data.addresses || data.address || prevUser?.address || [],
          active: data.active !== undefined ? data.active : prevUser?.active,
          provider: data.provider || data?.user?.provider || prevUser?.provider || "LOCAL",
          avatar: data.avatar || data.url || data?.user?.avatar || data?.user?.url || prevUser?.avatar || prevUser?.url || null,
          url: data.url || data.avatar || data?.user?.url || data?.user?.avatar || prevUser?.url || prevUser?.avatar || null,
        }
      : prevUser) ||
    null;

  currentUser = profileInfo;

  try {
    if (currentUser) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
  } catch {}

  notify();
}

export function clearSession() {
  accessToken = null;
  currentUser = null;

  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch {}

  notify();
}

export function getAccessToken() {
  return accessToken;
}

export function getCurrentUser() {
  return currentUser;
}

export function getAuthHeader() {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.message || data?.error || "Yêu cầu thất bại";
    throw new Error(message);
  }

  return data;
}

/**
 * Đăng nhập cục bộ (Email & Password)
 * Backend trả về Access Token trong body và tự động đặt HttpOnly Cookie (refreshToken)
 */
export async function loginLocal(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include", // Nhận và lưu HttpOnly Cookie từ backend
    body: JSON.stringify({ email: email.trim(), password }),
  });

  const data = await parseResponse(response);

  if (!data?.accessToken && !data?.token && !data?.userId) {
    throw new Error("Không nhận được access token từ server");
  }

  setSession(data);
  return data;
}

export async function registerLocal(payload) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export function loginWithGoogle() {
  window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
}

let refreshPromise = null;

/**
 * Làm mới Access Token thông qua HttpOnly Cookie refreshToken
 * Được gọi tự động khi F5 / mở lại trang hoặc khi Access Token hết hạn
 */
export async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include", // Tự động gửi kèm HttpOnly Cookie
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        clearSession();
        return null;
      }

      const data = await parseResponse(response);
      setSession(data);
      return data?.accessToken || data?.token || null;
    } catch (err) {
      // Khi offline / lỗi mạng: giữ profile hiển thị tạm nhưng không có token
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Fetch wrapper bảo mật tự động gửi Bearer token và HttpOnly cookie
 * Tự động silent-refresh token nếu nhận lỗi 401
 */
export async function authFetch(url, options = {}) {
  // Nếu chưa có accessToken trong RAM nhưng có profile đã đăng nhập (F5/mở tab mới)
  // hoặc đang có tiến trình refresh token đang chạy, hãy chờ refreshAccessToken xong trước!
  if (!accessToken && (currentUser?.userId || refreshPromise)) {
    await refreshAccessToken();
  }

  const isFormData = options.body instanceof FormData;
  const doFetch = (tokenOverride) => {
    const tokenToUse = tokenOverride || accessToken;
    const headers = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Accept: "application/json",
      ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
      ...(options.headers || {}),
    };

    return fetch(url, {
      credentials: "include", // Luôn gửi kèm cookie
      ...options,
      headers,
    });
  };

  let response = await doFetch();

  // Nếu Access Token hết hạn (401), tự động xếp hàng refresh và retry 1 lần
  if (response.status === 401) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      response = await doFetch(newToken);
    } else {
      if (currentUser?.userId) {
        clearSession();
        window.location.href = "/login";
      }
      throw new Error("Phiên đăng nhập đã hết hạn");
    }
  }

  return parseResponse(response);
}

/**
 * Đăng xuất: Yêu cầu backend xóa HttpOnly cookie và xóa sạch token trong RAM + profile cache
 */
export async function logout() {
  clearSession();

  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Phiên client đã được xóa sạch
  }
}

export async function handleGoogleSuccessToken() {
  return refreshAccessToken();
}
