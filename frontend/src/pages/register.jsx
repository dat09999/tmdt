import { useState } from "react";
import { useAuth } from "./Authcontext";
import "./regiter.css";

export default function RegisterPage() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { fullName, email, phone, password, confirmPassword } = formData;

    if (!fullName || !email || !phone || !password || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setLoading(true);
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      setSuccess("Đăng ký thành công! Chuyển về trang đăng nhập...");
      setTimeout(() => {
        window.location.href = "/";
      }, 1200);
    } catch (err) {
      setError(err.message || "Đăng ký không thành công. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-box">
        <div className="register-left">
          <h1>Tạo tài khoản mới</h1>
          <p>Đăng ký để tiếp tục mua sắm và nhận ưu đãi mới nhất.</p>
        </div>

        <div className="register-right">
          <h2>Đăng ký</h2>

          {error && <p className="message error">{error}</p>}
          {success && <p className="message success">{success}</p>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Họ và tên</label>
              <input
                type="text"
                name="fullName"
                placeholder="Nhập họ và tên"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Nhập email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="text"
                name="phone"
                placeholder="Nhập số điện thoại"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Mật khẩu</label>
              <input
                type="password"
                name="password"
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Xác nhận mật khẩu</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="register-btn" disabled={loading}>
              {loading ? "ĐANG XỬ LÝ..." : "Đăng ký"}
            </button>
          </form>

          <p className="login-link">
            Đã có tài khoản? <a href="/">Đăng nhập ngay</a>
          </p>
        </div>
      </div>
    </div>
  );
}
