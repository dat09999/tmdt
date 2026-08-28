import React, { useState } from "react";
import { registerLocal, loginWithGoogle } from "../utils/auth";
import Button from "../components/common/Button";
import { Lock, Mail, User, Phone, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không trùng khớp!");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    try {
      setLoading(true);
      await registerLocal({
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
      });

      setSuccessMessage("Đăng ký tài khoản thành công! Đang chuyển hướng sang đăng nhập...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (err) {
      setErrorMessage(err.message || "Đăng ký thất bại. Email có thể đã tồn tại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-page)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Simple Header */}
      <header
        style={{
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border-light)",
          padding: "16px 0",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
            }}
          >
            <span style={{ fontSize: "28px" }}>🛒</span>
            <span
              style={{
                fontSize: "24px",
                fontWeight: "900",
                color: "var(--primary)",
                letterSpacing: "-0.5px",
              }}
            >
              DoMix
            </span>
            <span style={{ fontSize: "16px", fontWeight: "600", color: "var(--text)", marginLeft: "8px" }}>
              Đăng Ký
            </span>
          </a>

          <a href="#" style={{ fontSize: "13px", color: "var(--primary)", fontWeight: "600" }}>
            Bạn cần trợ giúp?
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 16px",
          background: "linear-gradient(135deg, #ee4d2d 0%, #ff7a00 100%)",
        }}
      >
        <div
          className="container"
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            alignItems: "center",
            gap: "48px",
            maxWidth: "1000px",
          }}
        >
          {/* Left Column: Brand Hero */}
          <div className="hide-mobile" style={{ color: "#ffffff" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎁</div>
            <h1 style={{ fontSize: "36px", fontWeight: "900", lineHeight: "1.2", marginBottom: "14px" }}>
              Nhận Ngay Gói Voucher 500K Dành Cho Thành Viên Mới
            </h1>
            <p style={{ fontSize: "16px", opacity: 0.95, lineHeight: "1.6", maxWidth: "460px" }}>
              Đăng ký tài khoản miễn phí để nhận ưu đãi giảm giá độc quyền, miễn phí vận chuyển không giới hạn.
            </p>
          </div>

          {/* Right Column: Register Card */}
          <div
            className="card"
            style={{
              padding: "32px 28px",
              backgroundColor: "var(--surface)",
              borderRadius: "var(--r-lg)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              border: "none",
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text)", marginBottom: "20px" }}>
              Đăng Ký Tài Khoản
            </h2>

            {errorMessage && (
              <div
                style={{
                  backgroundColor: "var(--error-bg)",
                  color: "var(--error-dark)",
                  padding: "10px 14px",
                  borderRadius: "var(--r-sm)",
                  fontSize: "13px",
                  marginBottom: "16px",
                  border: "1px solid #fca5a5",
                }}
              >
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div
                style={{
                  backgroundColor: "var(--success-bg)",
                  color: "var(--success-dark)",
                  padding: "10px 14px",
                  borderRadius: "var(--r-sm)",
                  fontSize: "13px",
                  marginBottom: "16px",
                  border: "1px solid #a7f3d0",
                }}
              >
                {successMessage}
              </div>
            )}

            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Full Name */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
                  Họ và tên
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 36px",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-sm)",
                      fontSize: "13px",
                    }}
                    required
                  />
                  <User size={15} color="var(--text-tertiary)" style={{ position: "absolute", left: "12px", top: "12px" }} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
                  Email
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="email"
                    name="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 36px",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-sm)",
                      fontSize: "13px",
                    }}
                    required
                  />
                  <Mail size={15} color="var(--text-tertiary)" style={{ position: "absolute", left: "12px", top: "12px" }} />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
                  Số điện thoại
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="0912345678"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 36px",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-sm)",
                      fontSize: "13px",
                    }}
                    required
                  />
                  <Phone size={15} color="var(--text-tertiary)" style={{ position: "absolute", left: "12px", top: "12px" }} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
                  Mật khẩu
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="password"
                    name="password"
                    placeholder="Tối thiểu 6 ký tự"
                    value={formData.password}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 36px",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-sm)",
                      fontSize: "13px",
                    }}
                    required
                  />
                  <Lock size={15} color="var(--text-tertiary)" style={{ position: "absolute", left: "12px", top: "12px" }} />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
                  Xác nhận mật khẩu
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 36px",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-sm)",
                      fontSize: "13px",
                    }}
                    required
                  />
                  <Lock size={15} color="var(--text-tertiary)" style={{ position: "absolute", left: "12px", top: "12px" }} />
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                type="submit"
                loading={loading}
                block
                style={{ marginTop: "6px" }}
              >
                ĐĂNG KÝ
              </Button>
            </form>

            <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "var(--text-secondary)" }}>
              Bạn đã có tài khoản?{" "}
              <a href="/login" style={{ color: "var(--primary)", fontWeight: "700" }}>
                Đăng nhập ngay
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer minimal */}
      <footer
        style={{
          padding: "16px 0",
          backgroundColor: "var(--surface)",
          borderTop: "1px solid var(--border-light)",
          textAlign: "center",
          fontSize: "12px",
          color: "var(--text-tertiary)",
        }}
      >
        © 2026 DoMix. Bảo lưu mọi quyền.
      </footer>
    </div>
  );
}
