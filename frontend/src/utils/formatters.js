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
