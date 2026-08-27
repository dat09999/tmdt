import { useEffect, useRef, useState } from "react";
import { API_BASE_URL, authFetch } from "../utils/auth";
import { useAuth } from "./Authcontext";
import Header from "../components/Header";
import "./ProfilePage.css";
import "./AddressBookPage.css";

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

  useEffect(() => {
    if (!user?.userId) {
      window.location.href = "/login";
      return;
    }
    if (activeMenu === "info") {
      fetchProfile();
    }
  }, [user?.userId, activeMenu]);

  useEffect(() => {
    if (!user?.userId) return;
    if (activeMenu === "address-book") {
      fetchAddresses();
    }
  }, [user?.userId, activeMenu]);

  useEffect(() => {
    const closeOnOutsideClick = (e) => {
      if (suggestBoxRef.current && !suggestBoxRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  // --- Hàm Profile ---
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const data = await authFetch(`${API_BASE_URL}/api/users/${user.userId}`);
      const userData = data.user || data.data || data;
      setForm({
        fullName: userData.fullName || "",
        phone: userData.phone || "",
      });
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi khi tải hồ sơ");
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
      setMessage("");
      const updated = await authFetch(`${API_BASE_URL}/api/users/${user.userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      setMessage("Cập nhật thông tin thành công!");
      setEditing(false);

      if (typeof setUser === "function") {
        const updatedData = updated.user || updated.data || updated;
        setUser((prev) => ({ ...prev, ...updatedData }));
      }
    } catch (err) {
      setError(err.message || "Cập nhật thông tin thất bại");
    } finally {
      setSaving(false);
    }
  };

  // --- Hàm Sổ Địa Chỉ ---
  const fetchAddresses = async () => {
    try {
      setAddrLoading(true);
      setAddrError("");
      const data = await authFetch(`${API_BASE_URL}/api/users/${user.userId}`);
      const addrList = data.addresses || data.data?.addresses || [];
      setAddresses(addrList);
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
    setAddrForm((prev) => ({
      ...prev,
      detail: value,
      lat: null,
      lng: null,
      province: null,
      district: null,
      ward: null,
    }));
    setShowSuggestions(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setSuggestLoading(true);
        const data = await authFetch(
          `${API_BASE_URL}/api/geo/suggest?input=${encodeURIComponent(value.trim())}`
        );

        // Bóc tách linh hoạt dữ liệu mảng từ Backend
        const list = Array.isArray(data)
          ? data
          : data.predictions || data.data || data.items || [];

        setSuggestions(list);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 350);
  };

  const handleSelectSuggestion = async (suggestion) => {
    try {
      const placeId = suggestion.placeId || suggestion.place_id;
      const displayAddress =
        suggestion.description ||
        suggestion.text ||
        suggestion.formattedAddress ||
        addressInput;

      if (placeId) {
        const detail = await authFetch(
          `${API_BASE_URL}/api/geo/resolve?placeId=${encodeURIComponent(placeId)}`
        );
        const finalAddress = detail.formattedAddress || detail.address || displayAddress;
        
        setAddrForm((prev) => ({
          ...prev,
          detail: finalAddress,
          lat: detail.lat ?? null,
          lng: detail.lng ?? null,
        }));
        setAddressInput(finalAddress);
      } else {
        setAddrForm((prev) => ({ ...prev, detail: displayAddress }));
        setAddressInput(displayAddress);
      }
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const updatedList = data.addresses || data.data?.addresses || data;
      setAddresses(Array.isArray(updatedList) ? updatedList : []);
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
      const data = await authFetch(
        `${API_BASE_URL}/api/users/${user.userId}/addresses/${addressId}`,
        { method: "DELETE" }
      );
      const updatedList = data.addresses || data.data?.addresses || data;
      setAddresses(Array.isArray(updatedList) ? updatedList : []);
    } catch (err) {
      setAddrError(err.message || "Xóa địa chỉ thất bại");
    }
  };

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
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      setMessage("");
                      setError("");
                      setEditing(true);
                    }}
                  >
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
                  <strong>
                    {addr.fullName} · {addr.phone}
                  </strong>
                  <p>{addr.detail}</p>
                  <div className="address-item-actions">
                    <button type="button" onClick={() => openEditForm(addr)}>
                      Sửa
                    </button>
                    <button type="button" onClick={() => handleDelete(addr.id)}>
                      Xóa
                    </button>
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
                  <input
                    value={addrForm.fullName}
                    onChange={handleAddrFieldChange("fullName")}
                    required
                  />
                </div>

                <div className="profile-field">
                  <label>Số điện thoại</label>
                  <input
                    value={addrForm.phone}
                    onChange={handleAddrFieldChange("phone")}
                    required
                  />
                </div>

                {/* Container gợi ý địa chỉ bổ sung z-index trực tiếp */}
                <div
                  className="profile-field"
                  ref={suggestBoxRef}
                  style={{ position: "relative", zIndex: 999 }}
                >
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
                    <div
                      className="address-suggest-box"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "#fff",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        borderRadius: "4px",
                        maxHeight: "220px",
                        overflowY: "auto",
                        zIndex: 1000,
                      }}
                    >
                      {suggestLoading && (
                        <div className="address-suggest-item muted">Đang tìm...</div>
                      )}
                      {!suggestLoading &&
                        suggestions.length === 0 &&
                        addressInput.trim() && (
                          <div className="address-suggest-item muted">
                            Không tìm thấy địa chỉ
                          </div>
                        )}
                      {!suggestLoading &&
                        suggestions.map((s, index) => {
                          const mainText =
                            s.mainText ||
                            s.structured_formatting?.main_text ||
                            s.description ||
                            s.text ||
                            "";
                          const subText =
                            s.secondaryText ||
                            s.structured_formatting?.secondary_text ||
                            "";

                          return (
                            <button
                              type="button"
                              key={s.placeId || s.place_id || index}
                              className="address-suggest-item"
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "8px 12px",
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                display: "block",
                              }}
                              onClick={() => handleSelectSuggestion(s)}
                            >
                              <strong>{mainText}</strong>
                              {subText && (
                                <span
                                  style={{
                                    display: "block",
                                    fontSize: "0.85em",
                                    color: "#666",
                                  }}
                                >
                                  {subText}
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>

                <label className="address-default-check">
                  <input
                    type="checkbox"
                    checked={addrForm.isDefault}
                    onChange={handleAddrFieldChange("isDefault")}
                  />
                  Đặt làm địa chỉ mặc định
                </label>

                <div className="profile-actions">
                  <button type="submit" className="btn-primary" disabled={addrSaving}>
                    {addrSaving ? "Đang lưu..." : "Lưu địa chỉ"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowForm(false)}
                    disabled={addrSaving}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="profile-card">
        <h3>{SIDEBAR_MENU.find((m) => m.key === activeMenu)?.label}</h3>
        <p>Chức năng đang được phát triển...</p>
      </div>
    );
  };

  const displayName =
    user?.fullName || user?.name || user?.email?.split("@")[0] || "Tài khoản";
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
                className={
                  activeMenu === item.key
                    ? "profile-menu-item active"
                    : "profile-menu-item"
                }
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