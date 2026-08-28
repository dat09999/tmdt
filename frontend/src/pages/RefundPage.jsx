import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import SubNav from "../components/layout/SubNav";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import Button from "../components/common/Button";
import DevBadge from "../components/common/DevBadge";
import OrderTimeline from "../components/order/OrderTimeline";
import EmptyState from "../components/common/EmptyState";
import { refundService } from "../services/refundService";
import { orderService } from "../services/orderService";
import { useAuth } from "./Authcontext";
import { formatCurrency, formatDate } from "../utils/formatters";
import { RotateCcw, UploadCloud, CheckCircle2, AlertCircle, FileText } from "lucide-react";

export default function RefundPage() {
  const { user } = useAuth();
  const [refunds, setRefunds] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("history"); // "create" | "history"
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [solution, setSolution] = useState("REFUND_ONLY");
  const [refundAmount, setRefundAmount] = useState("");
  const [description, setDescription] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const searchParams = new URLSearchParams(window.location.search);
  const paramOrderId = searchParams.get("orderId");

  const loadData = async () => {
    try {
      setLoading(true);
      const [refList, ordList] = await Promise.all([
        refundService.getRefunds(),
        orderService.getBuyerOrders(user?.userId),
      ]);
      setRefunds(refList || []);
      setOrders(ordList || []);

      if (paramOrderId) {
        setSelectedOrderId(paramOrderId);
        setActiveTab("create");
      }
    } catch (err) {
      console.error("Load refund data error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.userId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Mock local blob URLs
      const urls = files.map((f) => URL.createObjectURL(f));
      setUploadedImages((prev) => [...prev, ...urls]);
    }
  };

  const handleSubmitRefund = async (e) => {
    e.preventDefault();
    if (!selectedOrderId) {
      showToast("Vui lòng chọn đơn hàng cần hoàn tiền!");
      return;
    }
    if (!reason) {
      showToast("Vui lòng chọn lý do hoàn tiền!");
      return;
    }

    try {
      setSubmitting(true);
      const selectedOrder = orders.find((o) => o.id === selectedOrderId || o.orderCode === selectedOrderId);

      const payload = {
        orderId: selectedOrderId,
        userId: user?.userId || "user-default",
        orderCode: selectedOrder?.orderCode || selectedOrderId,
        productName: selectedOrder?.items?.[0]?.productName || "Sản phẩm đơn hàng #" + selectedOrderId,
        variantSku: selectedOrder?.items?.[0]?.variantSku || "Mặc định",
        refundAmount: Number(refundAmount) || selectedOrder?.totalAmount || 189000,
        reason,
        solution,
        type: solution,
        description,
        images: uploadedImages.length > 0 ? uploadedImages : [
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300",
        ],
      };

      await refundService.createRefund(payload);
      showToast("Gửi yêu cầu hoàn tiền thành công!");
      setActiveTab("history");
      await loadData();
    } catch (err) {
      showToast("Có lỗi xảy ra: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <Header />
      <SubNav activeTab="refunds" />

      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            right: "20px",
            zIndex: 9999,
            backgroundColor: "#10b981",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "var(--r-md)",
            fontSize: "14px",
            fontWeight: "600",
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="page-content">
        <div className="container" style={{ maxWidth: "900px" }}>
          {/* Dev Banner */}
          <DevBadge variant="banner" />

          {/* Header */}
          <div className="section-header" style={{ marginBottom: "16px" }}>
            <h1 className="section-title" style={{ fontSize: "20px" }}>
              TRẢ HÀNG & HOÀN TIỀN
            </h1>
          </div>

          {/* Tabs */}
          <div
            className="card"
            style={{
              display: "flex",
              backgroundColor: "var(--surface)",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--border-light)",
              marginBottom: "20px",
            }}
          >
            <button
              onClick={() => setActiveTab("history")}
              style={{
                flex: 1,
                padding: "14px 16px",
                border: "none",
                borderBottom: activeTab === "history" ? "3px solid var(--primary)" : "3px solid transparent",
                backgroundColor: "transparent",
                color: activeTab === "history" ? "var(--primary)" : "var(--text)",
                fontWeight: activeTab === "history" ? "700" : "500",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Lịch Sử Yêu Cầu Hoàn Tiền ({refunds.length})
            </button>
            <button
              onClick={() => setActiveTab("create")}
              style={{
                flex: 1,
                padding: "14px 16px",
                border: "none",
                borderBottom: activeTab === "create" ? "3px solid var(--primary)" : "3px solid transparent",
                backgroundColor: "transparent",
                color: activeTab === "create" ? "var(--primary)" : "var(--text)",
                fontWeight: activeTab === "create" ? "700" : "500",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              + Gửi Yêu Cầu Hoàn Tiền Mới
            </button>
          </div>

          {/* Tab 1: Create Request Form */}
          {activeTab === "create" && (
            <div
              className="card"
              style={{
                padding: "24px",
                backgroundColor: "var(--surface)",
                borderRadius: "var(--r-lg)",
                border: "1px solid var(--border-light)",
              }}
            >
              <h2 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "18px" }}>
                Thông Tin Yêu Cầu Hoàn Tiền
              </h2>

              <form onSubmit={handleSubmitRefund} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {/* Select Order */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                    Chọn Đơn Hàng Cần Trả / Hoàn Tiền: <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <select
                    value={selectedOrderId}
                    onChange={(e) => {
                      setSelectedOrderId(e.target.value);
                      const target = orders.find((o) => o.id === e.target.value);
                      if (target) setRefundAmount(target.totalAmount);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-sm)",
                      fontSize: "13px",
                      backgroundColor: "var(--surface)",
                    }}
                    required
                  >
                    <option value="">-- Chọn đơn hàng --</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        Đơn #{o.orderCode || o.id} - {formatCurrency(o.totalAmount)} ({o.items?.[0]?.productName || "Sản phẩm"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reason Selector */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                    Lý Do Trả Hàng / Hoàn Tiền: <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-sm)",
                      fontSize: "13px",
                      backgroundColor: "var(--surface)",
                    }}
                    required
                  >
                    <option value="">-- Chọn lý do --</option>
                    <option value="Sản phẩm bị rách, vỡ, móp méo khi vận chuyển">Sản phẩm bị rách, vỡ, móp méo khi vận chuyển</option>
                    <option value="Sản phẩm lỗi kỹ thuật không hoạt động">Sản phẩm lỗi kỹ thuật không hoạt động</option>
                    <option value="Người bán giao sai màu sắc, kích thước, mẫu mã">Người bán giao sai màu sắc, kích thước, mẫu mã</option>
                    <option value="Hàng không đúng mô tả hoặc nghi ngờ hàng giả">Hàng không đúng mô tả hoặc nghi ngờ hàng giả</option>
                    <option value="Chưa nhận được bưu kiện nhưng đơn báo đã giao">Chưa nhận được bưu kiện nhưng đơn báo đã giao</option>
                  </select>
                </div>

                {/* Solution */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                    Phương Án Mong Muốn:
                  </label>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="solution"
                        checked={solution === "REFUND_ONLY"}
                        onChange={() => setSolution("REFUND_ONLY")}
                        style={{ accentColor: "var(--primary)" }}
                      />
                      <span>Chỉ Hoàn Tiền (Không cần gửi trả hàng)</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="solution"
                        checked={solution === "RETURN_AND_REFUND"}
                        onChange={() => setSolution("RETURN_AND_REFUND")}
                        style={{ accentColor: "var(--primary)" }}
                      />
                      <span>Trả Hàng & Hoàn Tiền</span>
                    </label>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                    Số Tiền Yêu Cầu Hoàn (₫): <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="Nhập số tiền..."
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-sm)",
                      fontSize: "13px",
                    }}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                    Mô Tả Chi Tiết Tình Trạng Lỗi:
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả cụ thể để shop và DoMix hỗ trợ giải quyết nhanh hơn..."
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-sm)",
                      fontSize: "13px",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* Evidence Upload */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                    Bằng Chứng Hình Ảnh / Video Mở Hộp:
                  </label>
                  <div
                    style={{
                      border: "2px dashed var(--border)",
                      borderRadius: "var(--r-md)",
                      padding: "24px",
                      textAlign: "center",
                      backgroundColor: "var(--surface-muted)",
                      cursor: "pointer",
                    }}
                    onClick={() => document.getElementById("evidence-upload").click()}
                  >
                    <UploadCloud size={32} color="var(--primary)" style={{ margin: "0 auto 8px" }} />
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)" }}>
                      Nhấn để tải lên ảnh hoặc video bằng chứng
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                      Hỗ trợ định dạng JPG, PNG, MP4 (Tối đa 5 file)
                    </div>
                    <input
                      id="evidence-upload"
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleImageUpload}
                      style={{ display: "none" }}
                    />
                  </div>

                  {uploadedImages.length > 0 && (
                    <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
                      {uploadedImages.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt="Bằng chứng"
                          style={{
                            width: "70px",
                            height: "70px",
                            borderRadius: "6px",
                            objectFit: "cover",
                            border: "1px solid var(--border)",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  loading={submitting}
                  block
                  style={{ marginTop: "10px" }}
                >
                  Gửi Yêu Cầu Hoàn Tiền
                </Button>
              </form>
            </div>
          )}

          {/* Tab 2: Refund History & Timeline */}
          {activeTab === "history" && (
            <div>
              {refunds.length === 0 ? (
                <EmptyState
                  icon={RotateCcw}
                  title="Chưa có yêu cầu hoàn tiền nào"
                  description="Bạn chưa tạo yêu cầu trả hàng hoặc hoàn tiền nào."
                  actionText="Tạo yêu cầu mới"
                  onAction={() => setActiveTab("create")}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {refunds.map((ref) => (
                    <div
                      key={ref.id}
                      className="card"
                      style={{
                        padding: "20px",
                        backgroundColor: "var(--surface)",
                        borderRadius: "var(--r-lg)",
                        border: "1px solid var(--border-light)",
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingBottom: "12px",
                          borderBottom: "1px solid var(--border-light)",
                          marginBottom: "14px",
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: "14px" }}>Mã yêu cầu: #{ref.refundCode}</strong>
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                            Đơn hàng: #{ref.orderCode} • Ngày tạo: {formatDate(ref.createdAt, true)}
                          </div>
                        </div>

                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "99px",
                            fontSize: "12px",
                            fontWeight: "700",
                            backgroundColor: ref.status === "COMPLETED" ? "var(--success-bg)" : "var(--warning-bg)",
                            color: ref.status === "COMPLETED" ? "var(--success-dark)" : "var(--warning-dark)",
                            border: `1px solid ${ref.status === "COMPLETED" ? "var(--success)" : "var(--warning)"}`,
                          }}
                        >
                          {ref.statusLabel || "Đang xử lý"}
                        </span>
                      </div>

                      {/* Product & Reason Info */}
                      <div style={{ fontSize: "13px", lineHeight: "1.6", marginBottom: "14px" }}>
                        <div><strong>Sản phẩm:</strong> {ref.productName} ({ref.variantSku})</div>
                        <div><strong>Lý do:</strong> {ref.reason}</div>
                        <div>
                          <strong>Số tiền hoàn: </strong>
                          <span style={{ color: "var(--primary)", fontWeight: "800" }}>
                            {formatCurrency(ref.refundAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Timeline */}
                      <OrderTimeline timeline={ref.timeline || []} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
