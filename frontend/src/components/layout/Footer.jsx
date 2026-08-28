import React from "react";
import { ShieldCheck, Truck, RotateCcw, Headphones, CreditCard } from "lucide-react";

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "var(--surface)",
        borderTop: "3px solid var(--primary)",
        marginTop: "48px",
        color: "var(--text-muted)",
        fontSize: "13px",
      }}
    >
      {/* Commitment Highlights */}
      <div
        style={{
          borderBottom: "1px solid var(--border-light)",
          padding: "28px 0",
          backgroundColor: "var(--surface-muted)",
        }}
      >
        <div
          className="container"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "var(--primary-light)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <strong style={{ display: "block", color: "var(--text)", fontSize: "14px" }}>
                100% Chính Hãng
              </strong>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Cam kết hoàn tiền gấp đôi nếu hàng giả
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "var(--primary-light)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Truck size={24} />
            </div>
            <div>
              <strong style={{ display: "block", color: "var(--text)", fontSize: "14px" }}>
                Giao Hàng Siêu Tốc
              </strong>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Hỏa tốc 2 giờ & Freeship toàn quốc
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "var(--primary-light)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <RotateCcw size={24} />
            </div>
            <div>
              <strong style={{ display: "block", color: "var(--text)", fontSize: "14px" }}>
                Đổi Trả Dễ Dàng
              </strong>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Miễn phí đổi trả trong vòng 15 ngày
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "var(--primary-light)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Headphones size={24} />
            </div>
            <div>
              <strong style={{ display: "block", color: "var(--text)", fontSize: "14px" }}>
                Hỗ Trợ 24/7
              </strong>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Hotline 1900 6868 & Chat trực tuyến
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div style={{ padding: "40px 0" }}>
        <div
          className="container"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "32px",
          }}
        >
          {/* Col 1 */}
          <div>
            <h4
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "var(--text)",
                marginBottom: "16px",
                textTransform: "uppercase",
              }}
            >
              Chăm sóc khách hàng
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
              <li><a href="#">Trung Tâm Trợ Giúp</a></li>
              <li><a href="#">Hướng Dẫn Mua Hàng</a></li>
              <li><a href="#">Hướng Dẫn Bán Hàng</a></li>
              <li><a href="/refunds">Chính Sách Trả Hàng & Hoàn Tiền</a></li>
              <li><a href="#">Chính Sách Bảo Hành</a></li>
            </ul>
          </div>

          {/* Col 2 */}
          <div>
            <h4
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "var(--text)",
                marginBottom: "16px",
                textTransform: "uppercase",
              }}
            >
              Về DoMix
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
              <li><a href="#">Giới Thiệu Về DoMix Việt Nam</a></li>
              <li><a href="#">Tuyển Dụng</a></li>
              <li><a href="#">Điều Khoản DoMix</a></li>
              <li><a href="#">Chính Sách Bảo Mật</a></li>
              <li><a href="/seller">Kênh Người Bán</a></li>
            </ul>
          </div>

          {/* Col 3: Thanh toán & Vận chuyển */}
          <div>
            <h4
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "var(--text)",
                marginBottom: "16px",
                textTransform: "uppercase",
              }}
            >
              Thanh toán & Vận chuyển
            </h4>
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px" }}>
                Phương thức thanh toán:
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span className="badge" style={{ background: "#e8f0fe", color: "#1967d2", padding: "6px 10px" }}>
                  💳 VNPAY
                </span>
                <span className="badge" style={{ background: "#fce8e6", color: "#d93025", padding: "6px 10px" }}>
                  👛 MoMo
                </span>
                <span className="badge" style={{ background: "#e6f4ea", color: "#137333", padding: "6px 10px" }}>
                  💵 Tiền mặt (COD)
                </span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px" }}>
                Đơn vị vận chuyển:
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span className="badge" style={{ background: "#f1f3f4", color: "#3c4043", padding: "6px 10px" }}>
                  🚚 GHN Express
                </span>
                <span className="badge" style={{ background: "#f1f3f4", color: "#3c4043", padding: "6px 10px" }}>
                  ⚡ Hỏa Tốc 2h
                </span>
              </div>
            </div>
          </div>

          {/* Col 4: Tải app */}
          <div>
            <h4
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "var(--text)",
                marginBottom: "16px",
                textTransform: "uppercase",
              }}
            >
              Tải ứng dụng DoMix ngay
            </h4>
            <p style={{ fontSize: "12px", marginBottom: "12px", lineHeight: "1.5" }}>
              Trải nghiệm mua sắm nhanh hơn, săn voucher độc quyền trên app.
            </p>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div
                style={{
                  width: "70px",
                  height: "70px",
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "36px",
                }}
              >
                📱
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span className="badge" style={{ background: "#000", color: "#fff", padding: "6px 12px" }}>
                  🍎 App Store
                </span>
                <span className="badge" style={{ background: "#000", color: "#fff", padding: "6px 12px" }}>
                  🤖 Google Play
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div
        style={{
          borderTop: "1px solid var(--border-light)",
          padding: "20px 0",
          textAlign: "center",
          fontSize: "12px",
          color: "var(--text-tertiary)",
        }}
      >
        <p>© 2026 DoMix E-Commerce Platform. Tất cả các quyền được bảo lưu.</p>
        <p style={{ marginTop: "4px" }}>
          Địa chỉ: Tòa nhà DoMix Tower, Quận 1, TP. Hồ Chí Minh | Giấy phép ĐKKD số: 0108889999
        </p>
      </div>
    </footer>
  );
}
