import React, { useMemo, useState } from "react";
import { useAuth } from "./Authcontext";
import "./loginPage.css";

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return email.trim() !== "" && password.trim() !== "" && !loading;
  }, [email, password, loading]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      window.location.href = "/";
    } catch (err) {
      setError("Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mixi-login-container">
      <div className="mixi-content-wrapper">
        <div className="mixi-hero-section">
          <div className="hero-bg" />
          <div className="hero-overlay" />

          <div className="mixi-logo-main">
            <div className="brand-logo-wrap">
              <img
                src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=120&q=80"
                alt="DoMix Store Logo"
                className="brand-logo"
              />
            </div>
            <h1>DOMIX STORE</h1>
            <p className="tagline">Mua sắm nhanh, đẹp, an toàn và cực chất</p>
          </div>

          <div className="streamer-card">
            <img
              src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80"
              alt="Gaming streamer"
              className="streamer-img"
            />
            <div className="streamer-info">
              <span className="streamer-label">Official Partner</span>
              <strong>Độ Mixi &amp; DoMix Store</strong>
              <p>Hàng chính hãng, ưu đãi mỗi ngày, trải nghiệm mua sắm mượt mà.</p>
            </div>
          </div>

          <div className="mixi-features-grid">
            <div className="feature-item">
              <div className="feature-icon">🛡️</div>
              <p>Bảo mật tốt</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <p>Đăng nhập nhanh</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🎁</div>
              <p>Nhiều ưu đãi</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🎧</div>
              <p>Hỗ trợ 24/7</p>
            </div>
          </div>
        </div>

        <div className="mixi-form-section">
          <div
            className="form-bg"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=1200&q=80')",
            }}
          />

          <div className="login-card">
            <div className="login-badge">WELCOME BACK</div>

            <h2 className="login-title">Đăng nhập</h2>
            <p className="login-subtitle">
              Chào mừng bạn quay trở lại DoMix Store
            </p>

            {error && (
              <div className="mixi-alert">
                <span className="alert-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="mixi-form">
              <div className="field-block">
                <label className="input-label">Tên đăng nhập / Email</label>
                <input
                  className="full-input"
                  type="text"
                  placeholder="Nhập tên đăng nhập hoặc email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="field-block">
                <label className="input-label">Mật khẩu</label>
                <div className="password-wrap">
                  <input
                    className="full-input password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? "Ẩn" : "Hiện"}
                  </button>
                </div>
              </div>

              <div className="form-row">
                <label className="remember-box">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>

                <a href="#" className="forgot-pw">
                  Quên mật khẩu?
                </a>
              </div>

              <button type="submit" className="btn-login-main" disabled={!canSubmit}>
                {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG NHẬP"}
              </button>

              <div className="trust-row">
                <div className="trust-item">✓ An toàn</div>
                <div className="trust-item">✓ Nhanh chóng</div>
                <div className="trust-item">✓ Tiện lợi</div>
              </div>

              <div className="social-separator">
                <span>HOẶC</span>
              </div>

              <button type="button" className="btn-google" onClick={loginWithGoogle}>
                <span className="google-icon">G</span>
                Đăng nhập với Google
              </button>

              <p className="policy-text">
                Bằng việc đăng nhập, bạn đồng ý với{" "}
                <a href="/">Điều khoản dịch vụ</a> và{" "}
                <a href="/">Chính sách bảo mật</a>.
              </p>

              <p className="footer-links">
                Bạn chưa có tài khoản? <a href="/register">Đăng ký ngay</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
