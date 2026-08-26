import { useEffect, useState } from "react";
import { API_BASE_URL, authFetch } from "../utils/auth";
import "./VnpayResultPage.css";

export default function VnpayResultPage() {
  const [message, setMessage] = useState("Đang xác minh kết quả thanh toán...");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    (async () => {
      try {
        const query = window.location.search;
        const result = await authFetch(`${API_BASE_URL}/api/payment/vnpay/return${query}`);
        const success = result.validSignature &&
          new URLSearchParams(query).get("vnp_ResponseCode") === "00" &&
          new URLSearchParams(query).get("vnp_TransactionStatus") === "00";

        if (!success) {
          sessionStorage.removeItem("pendingVnpayOrderIds");
          setStatus("error");
          setMessage("Thanh toán không thành công hoặc chữ ký không hợp lệ.");
          return;
        }

        const remaining = JSON.parse(sessionStorage.getItem("pendingVnpayOrderIds") || "[]");
        if (remaining.length) {
          setStatus("success");
          setMessage(`Thanh toán thành công. Đang chuyển sang đơn tiếp theo (${remaining.length} đơn)...`);
          const [nextOrderId, ...rest] = remaining;
          sessionStorage.setItem("pendingVnpayOrderIds", JSON.stringify(rest));
          const payment = await authFetch(`${API_BASE_URL}/api/payment/vnpay/create/${nextOrderId}`, { method: "POST" });
          window.location.href = payment.paymentUrl;
          return;
        }

        sessionStorage.removeItem("pendingVnpayOrderIds");
        sessionStorage.setItem("orderSuccessMessage", "Đã hoàn tất thanh toán VNPay.");
        window.location.href = "/orders";
      } catch (error) {
        setStatus("error");
        setMessage(error.message || "Không thể xác minh kết quả VNPay.");
      }
    })();
  }, []);

  return (
    <div className="vnpay-result-page">
      <div className={`vnpay-result-card ${status}`}>
        <div className="vnpay-result-icon" aria-hidden="true">
          {status === "loading" && <span className="vnpay-spinner" />}
          {status === "success" && "✓"}
          {status === "error" && "!"}
        </div>

        <h1>
          {status === "loading" && "Đang xử lý thanh toán"}
          {status === "success" && "Thanh toán thành công"}
          {status === "error" && "Thanh toán chưa hoàn tất"}
        </h1>

        <p>{message}</p>

        {status === "error" && (
          <a className="vnpay-result-button" href="/orders">
            Xem danh sách đơn hàng
          </a>
        )}
      </div>
    </div>
  );
}
