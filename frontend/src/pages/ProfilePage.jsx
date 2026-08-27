import { useEffect, useRef, useState } from "react";
import { API_BASE_URL, authFetch } from "../utils/auth";
import { useAuth } from "./Authcontext";
import Header from "../components/Header";
import "./ProfilePage.css";

const SIDEBAR_MENU = [
  { key: "info", label: "Thông tin cá nhân", icon: "👤", active: true },
  { key: "password", label: "Đổi mật khẩu", icon: "🔒", active: false },
  { key: "address-book", label: "Sổ địa chỉ", icon: "📍", active: false },
  { key: "orders", label: "Đơn hàng của tôi", icon: "📦", active: false },
  { key: "notifications", label: "Thông báo", icon: "🔔", active: false },
];

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ fullName: "", phone: "", address: "", lat: null, lng: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const debounceRef = useRef(null);
  const suggestBoxRef = useRef(null);

  useEffect(() => {
    if (!user?.userId) { window.location.href = "/login"; return; }
    fetchProfile();
  }, [user?.userId]);

  useEffect(() => {
    const closeOnOutsideClick = (e) => {
      if (suggestBoxRef.current && !suggestBoxRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await authFetch(`${API_BASE_URL}/users/${user.userId}`);
      setForm({
        fullName: data.fullName || "",
        phone: data.phone || "",
        address: data.address || "",
        lat: data.lat ?? null,
        lng: data.lng ?? null,
      });
      setAddressInput(data.address || "");
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi trong hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleAddressInputChange = (e) => {
    const value = e.target.value;
    setAddressInput(value);
    setForm((prev) => ({ ...prev, address: value, lat: null, lng: null }));
    setShowSuggestions(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      try {
        setSuggestLoading(true);
        const data = await authFetch(`${API_BASE_URL}/geo/suggest?input=${encodeURIComponent(value.trim())}`);
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 350);
  };

  const handleSelectSuggestion = async (suggestion) => {
    try {
      const detail = await authFetch(`${API_BASE_URL}/geo/resolve?placeId=${encodeURIComponent(suggestion.placeId)}`);
      setForm((prev) => ({
        ...prev,
        address: detail.formattedAddress || suggestion.text,
        lat: detail.lat ?? null,
        lng: detail.lng ?? null,
      }));
      setAddressInput(detail.formattedAddress || suggestion.text);
    } catch (err) {
      setError(err.message || "Không lấy được chi tiết địa chỉ");
    } finally {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      const updated = await authFetch(`${API_BASE_URL}/users/${user.userId}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setMessage("Cập nhật thông tin thành công");
      setEditing(false);
      if (typeof setUser === "function") {
        setUser((prev) => ({ ...prev, ...updated }));
      }
    } catch (err) {
      setError(err.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.fullName || user?.name || user?.email?.split("@")[0] || "Tài khoản";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="page-shell">
      <Header />

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-sidebar-user">
            <span className="profile-avatar sm">{avatarLetter}</span>
            <div>
              <strong>{displayName}</strong>
              <span className="profile-sidebar-edit">Sửa hồ sơ</span>
            </div>
          </div>

          <nav className="profile-sidebar-menu">
            {SIDEBAR_MENU.map((item) => (
              <button
                key={item.key}
                type="button"
                className={item.active ? "profile-menu-item active" : "profile-menu-item"}
              >
                <span className="profile-menu-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-header">
              <h2>Hồ sơ của tôi</h2>
              <p className="profile-subtitle">Quản lý thông tin để bảo mật tài khoản</p>
            </div>

            {message && <div className="profile-message success">{message}</div>}
            {error && <div className="profile-message error">{error}</div>}

            {loading ? (
              <div className="profile-loading">Đang tải thông tin...</div>
            ) : (
              <form className="profile-form" onSubmit={handleSave}>
                <div className="profile-field">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={handleChange("fullName")}
                    disabled={!editing}
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div className="profile-field">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={handleChange("phone")}
                    disabled={!editing}
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div className="profile-field" ref={suggestBoxRef} style={{ position: "relative" }}>
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    value={addressInput}
                    onChange={handleAddressInputChange}
                    onFocus={() => addressInput.trim() && setShowSuggestions(true)}
                    disabled={!editing}
                    placeholder="Nhập địa chỉ để tìm kiếm..."
                    autoComplete="off"
                  />
                  {editing && showSuggestions && (
                    <div className="address-suggest-box">
                      {suggestLoading && <div className="address-suggest-item muted">Đang tìm...</div>}
                      {!suggestLoading && suggestions.length === 0 && addressInput.trim() && (
                        <div className="address-suggest-item muted">Không tìm thấy địa chỉ</div>
                      )}
                      {!suggestLoading && suggestions.map((s) => (
                        <button
                          type="button"
                          key={s.placeId}
                          className="address-suggest-item"
                          onClick={() => handleSelectSuggestion(s)}
                        >
                          <strong>{s.mainText}</strong>
                          <span>{s.secondaryText}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="profile-field">
                  <label>Email</label>
                  <input type="email" value={user?.email || ""} disabled />
                </div>

                <div className="profile-actions">
                  {editing ? (
                    <>
                      <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => { setEditing(false); fetchProfile(); }}
                        disabled={saving}
                      >
                        Hủy
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn-primary" onClick={() => setEditing(true)}>
                      Chỉnh sửa
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}