import { useEffect, useRef, useState } from "react";
import { API_BASE_URL, authFetch } from "../utils/auth";
import { useAuth } from "./Authcontext";
import Header from "../components/Header";
import "./ProfilePage.css";
import "./AddressBookPage.css"; // Import CSS của AddressBook

const SIDEBAR_MENU = [
  { key: "info", label: "Thông tin cá nhân", icon: "👤" },
  { key: "password", label: "Đổi mật khẩu", icon: "🔒" },
  { key: "address-book", label: "Sổ địa chỉ", icon: "📍" },
  { key: "orders", label: "Đơn hàng của tôi", icon: "📦" },
  { key: "notifications", label: "Thông báo", icon: "🔔" },
];

const EMPTY_ADDRESS_FORM = {
  fullName: "",
  phone: "",
  detail: "",
  province: null,
  district: null,
  ward: null,
  lat: null,
  lng: null,
  isDefault: false,
};

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [activeMenu, setActiveMenu] = useState("info");

  // --- State cho thông tin cá nhân ---
  const [form, setForm] = useState({ fullName: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // --- State cho sổ địa chỉ ---
  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [addrError, setAddrError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [addrForm, setAddrForm] = useState(EMPTY_ADDRESS_FORM);
  const [addrSaving, setAddrSaving] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const debounceRef = useRef(null);
  const suggestBoxRef = useRef(null);

  // Fetch profile khi activeMenu === "info" hoặc lần đầu
  useEffect(() => {
    if (!user?.userId) {
      window.location.href = "/login";
      return;
    }
    if (activeMenu === "info") {
      fetchProfile();
    }
  }, [user?.userId, activeMenu]);

  // Fetch address khi activeMenu === "address-book"
  useEffect(() => {
    if (!user?.userId) return;
    if (activeMenu === "address-book") {
      fetchAddresses();
    }
  }, [user?.userId, activeMenu]);

  // Xử lý click outside cho dropdown gợi ý địa chỉ
  useEffect(() => {
    const closeOnOutsideClick = (e) => {
      if (suggestBoxRef.current && !suggestBoxRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  // --- Hàm cho profile ---
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await authFetch(`${API_BASE_URL}/api/users/${user.userId}`);
      setForm({
        fullName: data.fullName || "",
        phone: data.phone || "",
      });
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi trong hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      const updated = await authFetch(`${API_BASE_URL}/api/users/${user.userId}`, {
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

  // --- Hàm cho sổ địa chỉ ---
  const fetchAddresses = async () => {
    try {
      setAddrLoading(true);
      setAddrError("");
      const data = await authFetch(`${API_BASE_URL}/api/users/${user.userId}`);
      setAddresses(data.addresses || []);
    } catch (err) {
      setAddrError(err.message || "Không tải được sổ địa chỉ");
    } finally {
      setAddrLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingId(null);
    setAddrForm(EMPTY_ADDRESS_FORM);
    setAddressInput("");
    setShowForm(true);
  };

  const openEditForm = (address) => {
    setEditingId(address.id);
    setAddrForm({
      fullName: address.fullName || "",
      phone: address.phone || "",
      detail: address.detail || "",
      province: address.province,
      district: address.district,
      ward: address.ward,
      lat: address.lat,
      lng: address.lng,
      isDefault: !!address.isDefault,
    });
    setAddressInput(address.detail || "");
    setShowForm(true);
  };

  const handleAddressSearch = (e) => {
    const value = e.target.value;
    setAddressInput(value);
    setAddrForm((prev) => ({ ...prev, detail: value, lat: null, lng: null, province: null, district: null, ward: null }));
    setShowSuggestions(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setSuggestLoading(true);
        const data = await authFetch(`${API_BASE_URL}/api/geo/suggest?input=${encodeURIComponent(value.trim())}`);
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
      const detail = await authFetch(`${API_BASE_URL}/api/geo/resolve?placeId=${encodeURIComponent(suggestion.placeId)}`);
      setAddrForm((prev) => ({
        ...prev,
        detail: detail.formattedAddress || suggestion.text,
        lat: detail.lat ?? null,
        lng: detail.lng ?? null,
      }));
      setAddressInput(detail.formattedAddress || suggestion.text);
    } catch (err) {
      setAddrError(err.message || "Không lấy được chi tiết địa chỉ");
    } finally {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleAddrFieldChange = (field) => (e) => {
    const value = field === "isDefault" ? e.target.checked : e.target.value;
    setAddrForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddrSubmit = async (e) => {
    e.preventDefault();
    try {
      setAddrSaving(true);
      setAddrError("");

      const payload = {
        fullName: addrForm.fullName,
        phone: addrForm.phone,
        province: addrForm.province,
        district: addrForm.district,
        ward: addrForm.ward,
        detail: addrForm.detail,
        lat: addrForm.lat,
        lng: addrForm.lng,
        isDefault: addrForm.isDefault,
      };

      const url = editingId
        ? `${API_BASE_URL}/api/users/${user.userId}/addresses/${editingId}`
        : `${API_BASE_URL}/api/users/${user.userId}/addresses`;

      const data = await authFetch(url, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      setAddresses(data.addresses || []);
      setShowForm(false);
    } catch (err) {
      setAddrError(err.message || "Lưu địa chỉ thất bại");
    } finally {
      setAddrSaving(false);
    }
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm("Xóa địa chỉ này?")) return;
    try {
      const data = await authFetch(`${API_BASE_URL}/api/users/${user.userId}/addresses/${addressId}`, {
        method: "DELETE",
      });
      setAddresses(data.addresses || []);
    } catch (err) {
      setAddrError(err.message || "Xóa địa chỉ thất bại");
    }
  };

  // --- Render content ---
  const renderContent = () => {
    if (activeMenu === "info") {
      return (
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
                      onClick={() => {
                        setEditing(false);
                        fetchProfile();
                      }}
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
      );
    }

    if (activeMenu === "address-book") {
      return (
        <div className="address-book">
          <div className="address-book-header">
            <h2>Sổ địa chỉ</h2>
            <button type="button" className="btn-primary" onClick={openAddForm}>
              + Thêm địa chỉ mới
            </button>
          </div>

          {addrError && <div className="profile-message error">{addrError}</div>}

          {addrLoading ? (
            <div className="profile-loading">Đang tải...</div>
          ) : addresses.length === 0 ? (
            <div className="address-empty">Bạn chưa có địa chỉ nào.</div>
          ) : (
            <div className="address-list">
              {addresses.map((addr) => (
                <div key={addr.id} className="address-item">
                  {addr.isDefault && <span className="address-badge">Mặc định</span>}
                  <strong>{addr.fullName} · {addr.phone}</strong>
                  <p>{addr.detail}</p>
                  <div className="address-item-actions">
                    <button type="button" onClick={() => openEditForm(addr)}>Sửa</button>
                    <button type="button" onClick={() => handleDelete(addr.id)}>Xóa</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showForm && (
            <div className="address-form-overlay">
              <form className="address-form" onSubmit={handleAddrSubmit}>
                <h3>{editingId ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}</h3>

                <div className="profile-field">
                  <label>Họ tên người nhận</label>
                  <input value={addrForm.fullName} onChange={handleAddrFieldChange("fullName")} required />
                </div>

                <div className="profile-field">
                  <label>Số điện thoại</label>
                  <input value={addrForm.phone} onChange={handleAddrFieldChange("phone")} required />
                </div>

                <div className="profile-field" ref={suggestBoxRef} style={{ position: "relative" }}>
                  <label>Địa chỉ</label>
                  <input
                    value={addressInput}
                    onChange={handleAddressSearch}
                    onFocus={() => addressInput.trim() && setShowSuggestions(true)}
                    placeholder="Nhập địa chỉ để tìm kiếm..."
                    autoComplete="off"
                    required
                  />
                  {showSuggestions && (
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

                <label className="address-default-check">
                  <input type="checkbox" checked={addrForm.isDefault} onChange={handleAddrFieldChange("isDefault")} />
                  Đặt làm địa chỉ mặc định
                </label>

                <div className="profile-actions">
                  <button type="submit" className="btn-primary" disabled={addrSaving}>
                    {addrSaving ? "Đang lưu..." : "Lưu địa chỉ"}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setShowForm(false)} disabled={addrSaving}>
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      );
    }

    // Các menu khác
    return (
      <div className="profile-card">
        <h3>{SIDEBAR_MENU.find((m) => m.key === activeMenu)?.label}</h3>
        <p>Chức năng đang được phát triển...</p>
      </div>
    );
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
                className={activeMenu === item.key ? "profile-menu-item active" : "profile-menu-item"}
                onClick={() => setActiveMenu(item.key)}
              >
                <span className="profile-menu-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>
        <div className="profile-content">{renderContent()}</div>
      </div>
    </div>
  );
}