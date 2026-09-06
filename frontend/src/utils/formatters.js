/**
 * Formatter utilities for Vietnamese E-Commerce
 */

// Format price to VNĐ (e.g. 150000 -> "150.000₫")
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return "0₫";
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  })
    .format(Number(amount))
    .replace("₫", "₫")
    .trim();
}

// Format number (e.g. 150000 -> "150.000")
export function formatNumber(num) {
  if (num === undefined || num === null || isNaN(Number(num))) return "0";
  return Number(num).toLocaleString("vi-VN");
}

// Format sold count (e.g. 1200 -> "1,2k", 15000 -> "15k")
export function formatSoldCount(count) {
  const n = Number(count) || 0;
  if (n >= 1000000) {
    return `${(n / 1000000).toFixed(1).replace(".0", "")}tr`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1).replace(".0", "")}k`;
  }
  return n.toString();
}

// Format relative or date string in vi-VN
export function formatDate(dateInput, includeTime = false) {
  if (!dateInput) return "—";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "—";
  
  if (includeTime) {
    return date.toLocaleDateString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Format time ago (e.g. "Vừa xong", "5 phút trước", "2 giờ trước")
export function formatTimeAgo(dateInput) {
  if (!dateInput) return "Vừa xong";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Vừa xong";
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Vừa xong";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  return formatDate(dateInput);
}

// Validate whether an avatar URL is actually loadable in the browser
export function isValidAvatarUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  // Valid local data previews
  if (trimmed.startsWith("data:image/") || trimmed.startsWith("blob:")) return true;
  // Relative paths like /api/files/... or user/...
  if (trimmed.startsWith("/") || trimmed.startsWith("user/")) return true;
  // Must start with http or https
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return false;
  // If it's an old localhost MinIO link with :9000/, toFullImageUrl rewrites it to API proxy
  if (trimmed.includes(":9000/")) return true;
  // In HTTPS production, other local dev URLs cannot be loaded (Mixed Content / unreachable)
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    if (trimmed.includes("localhost") || trimmed.includes("127.0.0.1")) {
      return false;
    }
  }
  return true;
}

