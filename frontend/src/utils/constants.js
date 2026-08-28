/**
 * Common constants for e-commerce system
 */

export const ORDER_STATUS = {
  PENDING: {
    key: "PENDING",
    label: "Chờ xác nhận",
    badgeClass: "badge-warning",
    color: "#f5a623",
    desc: "Đơn hàng đang chờ người bán xác nhận",
  },
  PROCESSING: {
    key: "PROCESSING",
    label: "Đang xử lý / Đóng gói",
    badgeClass: "badge-info",
    color: "#1a73e8",
    desc: "Người bán đang chuẩn bị hàng",
  },
  SHIPPING: {
    key: "SHIPPING",
    label: "Đang giao hàng",
    badgeClass: "badge-primary",
    color: "#ee4d2d",
    desc: "Đơn hàng đang được đơn vị vận chuyển giao tới bạn",
  },
  DELIVERED: {
    key: "DELIVERED",
    label: "Đã giao thành công",
    badgeClass: "badge-success",
    color: "#00bfa5",
    desc: "Đơn hàng đã được giao thành công",
  },
  CANCELLED: {
    key: "CANCELLED",
    label: "Đã hủy",
    badgeClass: "badge-error",
    color: "#e53935",
    desc: "Đơn hàng đã bị hủy",
  },
  REFUNDING: {
    key: "REFUNDING",
    label: "Yêu cầu Trả hàng / Hoàn tiền",
    badgeClass: "badge-warning",
    color: "#ff9800",
    desc: "Đang trong tiến trình xử lý yêu cầu hoàn tiền",
  },
  REFUNDED: {
    key: "REFUNDED",
    label: "Đã hoàn tiền",
    badgeClass: "badge-info",
    color: "#9c27b0",
    desc: "Đã hoàn tiền thành công vào tài khoản",
  },
};

export const PAYMENT_METHODS = {
  COD: {
    key: "COD",
    label: "Thanh toán khi nhận hàng (COD)",
    desc: "Thanh toán tiền mặt khi shipper giao hàng tới tận nơi",
    icon: "💵",
  },
  VNPAY: {
    key: "VNPAY",
    label: "Thanh toán qua VNPAY",
    desc: "Quét mã VNPAY-QR, Thẻ ATM nội địa, Internet Banking, Thẻ quốc tế Visa/Master",
    icon: "💳",
  },
  MOMO: {
    key: "MOMO",
    label: "Ví MoMo",
    desc: "Thanh toán trực tuyến qua ứng dụng ví điện tử MoMo",
    icon: "👛",
  },
};

export const SHIPPING_PROVIDERS = [
  { id: "express", name: "Hỏa Tốc (Nhận trong ngày)", price: 45000, estDays: "Hôm nay" },
  { id: "fast", name: "Giao Hàng Nhanh (Giao trong 2-3 ngày)", price: 25000, estDays: "2 - 3 ngày" },
  { id: "economy", name: "Tiết Kiệm (Giao trong 4-6 ngày)", price: 15000, estDays: "4 - 6 ngày" },
];
