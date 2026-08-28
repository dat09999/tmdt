import React, { useState } from "react";
import { loginLocal, loginWithGoogle } from "../utils/auth";
import { useAuth } from "./Authcontext";
import Button from "../components/common/Button";
import { Lock, Mail, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const { setSessionFromAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      const data = await loginLocal(email, password);
      if (setSessionFromAuth) setSessionFromAuth(data);
      window.location.href = "/";
    } catch (err) {
      setErrorMessage(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!");
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
              Đăng Nhập
            </span>
          </a>

          <a href="#" style={{ fontSize: "13px", color: "var(--primary)", fontWeight: "600" }}>
            Bạn cần trợ giúp?
          </a>
        </div>
      </header>

      {/* Main Container: 2 Columns */}
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
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🛒</div>
            <h1 style={{ fontSize: "36px", fontWeight: "900", lineHeight: "1.2", marginBottom: "14px" }}>
              Sàn Thương Mại Điện Tử Hàng Đầu Việt Nam
            </h1>
            <p style={{ fontSize: "16px", opacity: 0.95, lineHeight: "1.6", maxWidth: "460px" }}>
              Mua sắm hàng triệu sản phẩm chính hãng, săn voucher flash sale mỗi ngày và nhận hàng hỏa tốc trong 2 giờ.
            </p>
            <div style={{ display: "flex", gap: "24px", marginTop: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={22} color="#fff" />
                <span style={{ fontSize: "14px", fontWeight: "600" }}>100% Chính Hãng</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>⚡</span>
                <span style={{ fontSize: "14px", fontWeight: "600" }}>Freeship 0Đ</span>
              </div>
            </div>
          </div>

          {/* Right Column: Login Card */}
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
              Đăng Nhập
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

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                  Email hoặc Tên đăng nhập
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 14px 11px 38px",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-sm)",
                      fontSize: "14px",
                      outline: "none",
                    }}
                    required
                  />
                  <Mail
                    size={16}
                    color="var(--text-tertiary)"
                    style={{ position: "absolute", left: "12px", top: "14px" }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                  Mật khẩu
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 40px 11px 38px",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-sm)",
                      fontSize: "14px",
                      outline: "none",
                    }}
                    required
                  />
                  <Lock
                    size={16}
                    color="var(--text-tertiary)"
                    style={{ position: "absolute", left: "12px", top: "14px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "12px",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <a href="#" style={{ fontSize: "12px", color: "var(--info)" }}>
                  Quên mật khẩu?
                </a>
              </div>

              <Button
                variant="primary"
                size="lg"
                type="submit"
                loading={loading}
                block
                style={{ marginTop: "4px" }}
              >
                ĐĂNG NHẬP
              </Button>
            </form>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                margin: "20px 0",
                color: "var(--text-tertiary)",
                fontSize: "12px",
              }}
            >
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
              <span>HOẶC</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
            </div>

            {/* Google OAuth2 Button */}
            <button
              type="button"
              onClick={loginWithGoogle}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "11px 16px",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-sm)",
                backgroundColor: "#ffffff",
                fontSize: "13px",
                fontWeight: "700",
                color: "var(--text)",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.37 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Đăng nhập với Google</span>
            </button>

            {/* Switch to Register */}
            <div style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "var(--text-secondary)" }}>
              Bạn mới biết đến DoMix?{" "}
              <a href="/register" style={{ color: "var(--primary)", fontWeight: "700" }}>
                Đăng ký ngay
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
