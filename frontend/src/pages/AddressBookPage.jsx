import { useEffect, useRef, useState } from "react";
import { API_BASE_URL, authFetch } from "../utils/auth";
import { useAuth } from "./Authcontext";
import Header from "../components/Header";
import "./AddressBookPage.css";

const EMPTY_FORM = {
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

export default function AddressBookPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const debounceRef = useRef(null);
  const suggestBoxRef = useRef(null);

  useEffect(() => {
    if (!user?.userId) { window.location.href = "/login"; return; }
    fetchUser();
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

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await authFetch(`${API_BASE_URL}/api/users/${user.userId}`);
      setAddresses(data.addresses || []);
    } catch (err) {
      setError(err.message || "Không tải được sổ địa chỉ");
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setAddressInput("");
    setShowForm(true);
  };

  const openEditForm = (address) => {
    setEditingId(address.id);
    setForm({
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
    setForm((prev) => ({ ...prev, detail: value, lat: null, lng: null, province: null, district: null, ward: null }));
    setShowSuggestions(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setSuggestions([]); return; }

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

  // Đây là chỗ "chuyển từ geo thành Address": lấy PlaceDetail rồi map thẳng vào form
  const handleSelectSuggestion = async (suggestion) => {
    try {
      const detail = await authFetch(`${API_BASE_URL}/api/geo/resolve?placeId=${encodeURIComponent(suggestion.placeId)}`);
      setForm((prev) => ({
        ...prev,
        detail: detail.formattedAddress || suggestion.text,
        lat: detail.lat ?? null,
        lng: detail.lng ?? null,
        // province/district/ward không có từ Google -> giữ null, user có thể không cần nhập
      }));
      setAddressInput(detail.formattedAddress || suggestion.text);
    } catch (err) {
      setError(err.message || "Không lấy được chi tiết địa chỉ");
    } finally {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleFieldChange = (field) => (e) => {
    const value = field === "isDefault" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");

      const payload = {
        fullName: form.fullName,
        phone: form.phone,
        province: form.province,
        district: form.district,
        ward: form.ward,
        detail: form.detail,
        lat: form.lat,
        lng: form.lng,
        isDefault: form.isDefault,
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
      setError(err.message || "Lưu địa chỉ thất bại");
    } finally {
      setSaving(false);
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
      setError(err.message || "Xóa địa chỉ thất bại");
    }
  };

  return (
    <div className="page-shell">
      <Header />

      <div className="address-book">
        <div className="address-book-header">
          <h2>Sổ địa chỉ</h2>
          <button type="button" className="btn-primary" onClick={openAddForm}>
            + Thêm địa chỉ mới
          </button>
        </div>

        {error && <div className="profile-message error">{error}</div>}

        {loading ? (
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
            <form className="address-form" onSubmit={handleSubmit}>
              <h3>{editingId ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}</h3>

              <div className="profile-field">
                <label>Họ tên người nhận</label>
                <input value={form.fullName} onChange={handleFieldChange("fullName")} required />
              </div>

              <div className="profile-field">
                <label>Số điện thoại</label>
                <input value={form.phone} onChange={handleFieldChange("phone")} required />
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
                <input type="checkbox" checked={form.isDefault} onChange={handleFieldChange("isDefault")} />
                Đặt làm địa chỉ mặc định
              </label>

              <div className="profile-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu địa chỉ"}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)} disabled={saving}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}