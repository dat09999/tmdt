import React, { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import SubNav from "../components/layout/SubNav";
import Button from "../components/common/Button";
import { formatCurrency } from "../utils/formatters";
import { CheckCircle2, XCircle, ArrowRight, Home, Package } from "lucide-react";

export default function VnpayResultPage() {
  const [result, setResult] = useState({
    success: false,
    orderCode: "",
    amount: 0,
    bankCode: "",
    transactionNo: "",
    date: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const responseCode = params.get("vnp_ResponseCode");
    const txnRef = params.get("vnp_TxnRef") || "DOMIX" + Date.now().toString().slice(-6);
    const amount = Number(params.get("vnp_Amount") || 0) / 100;
    const bankCode = params.get("vnp_BankCode") || "NCB";
    const transactionNo = params.get("vnp_TransactionNo") || "14892019";
    const payDate = params.get("vnp_PayDate") || new Date().toISOString();

    setResult({
      success: responseCode === "00",
      orderCode: txnRef,
      amount,
      bankCode,
      transactionNo,
      date: payDate,
    });
  }, []);

  return (
    <div className="page-shell">
      <Header />
      <SubNav />

      <main className="page-content">
        <div className="container" style={{ maxWidth: "600px", margin: "40px auto" }}>
          <div
            className="card"
            style={{
              padding: "36px 28px",
              textAlign: "center",
              backgroundColor: "var(--surface)",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--border-light)",
            }}
          >
            {result.success ? (
              <>
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    backgroundColor: "var(--success-bg)",
                    color: "var(--success)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <CheckCircle2 size={44} />
                </div>
                <h1 style={{ fontSize: "22px", fontWeight: "900", color: "var(--text)" }}>
                  Thanh Toán VNPAY Thành Công!
                </h1>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "6px" }}>
                  Đơn hàng của bạn đã được tiếp nhận và người bán đang chuẩn bị đóng gói.
                </p>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    backgroundColor: "var(--error-bg)",
                    color: "var(--error)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <XCircle size={44} />
                </div>
                <h1 style={{ fontSize: "22px", fontWeight: "900", color: "var(--error)" }}>
                  Thanh Toán Thất Bại hoặc Bị Hủy
                </h1>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "6px" }}>
                  Giao dịch chưa được hoàn tất. Bạn có thể thử lại hoặc chọn hình thức thanh toán COD.
                </p>
              </>
            )}

            {/* Bill Details Info */}
            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                backgroundColor: "var(--surface-muted)",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--border-light)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontSize: "13px",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Mã đơn hàng:</span>
                <strong>#{result.orderCode}</strong>
              </div>
              {result.amount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Số tiền đã thanh toán:</span>
                  <strong style={{ color: "var(--primary)", fontSize: "15px" }}>
                    {formatCurrency(result.amount)}
                  </strong>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Ngân hàng / Cổng:</span>
                <span>{result.bankCode} (VNPAY-QR)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Mã giao dịch:</span>
                <span>{result.transactionNo}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <Button
                variant="outline"
                icon={Home}
                onClick={() => (window.location.href = "/")}
                style={{ flex: 1 }}
              >
                Về Trang Chủ
              </Button>
              <Button
                variant="primary"
                icon={Package}
                onClick={() => (window.location.href = `/orders/${result.orderCode}`)}
                style={{ flex: 1 }}
              >
                Xem Đơn Hàng
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
