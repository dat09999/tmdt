export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080";

let accessToken = null;
let currentUser = null;

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

function setSession(data) {
  accessToken = data?.accessToken || null;
  currentUser = data || null;
  notify();
}

function clearSession() {
  accessToken = null;
  currentUser = null;
  notify();
}

export function getAccessToken() {
  return accessToken;
}

export function getCurrentUser() {
  return currentUser;
}

export function getAuthHeader() {
  return accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};
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

export async function loginLocal(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email: email.trim(), password }),
  });

  const data = await parseResponse(response);

  if (!data?.accessToken) {
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
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export function loginWithGoogle() {
  window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
}

let refreshPromise = null;

export async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        clearSession();
        return null;
      }

      const data = await parseResponse(response);
      setSession(data);
      return data.accessToken;
    } catch {
      clearSession();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function authFetch(url, options = {}) {
  const isFormData = options.body instanceof FormData;
  const doFetch = () =>
    fetch(url, {
      credentials: "include",
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        Accept: "application/json",
        ...getAuthHeader(),
        ...(options.headers || {}),
      },
    });

  let response = await doFetch();

  if (response.status === 401) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      response = await doFetch();
    } else {
      window.location.href = "/login";
      throw new Error("Phiên đăng nhập đã hết hạn");
    }
  }

  return parseResponse(response);
}

export async function logout() {
  clearSession();

  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Phiên phía client vẫn được xóa nếu backend tạm thời không phản hồi.
  }
}

export async function handleGoogleSuccessToken() {
  return refreshAccessToken();
}
