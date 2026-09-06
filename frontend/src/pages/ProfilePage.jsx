import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import SubNav from "../components/layout/SubNav";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import AddressAutocomplete from "../components/common/AddressAutocomplete";
import { useAuth } from "./Authcontext";
import { setSession } from "../utils/auth";
import { userService } from "../services/userService";
import { couponService } from "../services/couponService";
import { formatCurrency, isValidAvatarUrl } from "../utils/formatters";
import {
  User,
  MapPin,
  Lock,
  Ticket,
  Package,
  RotateCcw,
  Camera,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  ShieldCheck,
  Loader2,
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    const p = window.location.pathname;
    if (p === "/addresses" || p === "/address-book") return "addresses";
    return "profile";
  });
  const [toastMessage, setToastMessage] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [mainAvatarError, setMainAvatarError] = useState(false);
  const [sidebarAvatarError, setSidebarAvatarError] = useState(false);

  // Profile Form state
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || user?.name || "Người dùng",
    email: user?.email || "",
    phoneNumber: user?.phone || user?.phoneNumber || "",
    gender: "male",
    birthDate: "1998-05-15",
    avatar: user?.avatar || user?.url || "",
    provider: user?.provider || "LOCAL",
  });

  useEffect(() => {
    if (user) {
      setProfileData((prev) => ({
        ...prev,
        fullName: user.fullName || user.name || prev.fullName,
        email: user.email || prev.email,
        phoneNumber: user.phone || user.phoneNumber || prev.phoneNumber,
        avatar: user.avatar || user.url || prev.avatar,
        provider: user.provider || prev.provider || "LOCAL",
      }));
      setMainAvatarError(false);
      setSidebarAvatarError(false);
    }
  }, [user?.userId, user?.avatar, user?.url, user?.fullName, user?.phone]);

  const isGoogleUser = (profileData.provider || user?.provider || "").toUpperCase() === "GOOGLE";

  useEffect(() => {
    if (isGoogleUser && activeTab === "password") {
      setActiveTab("profile");
    }
  }, [isGoogleUser, activeTab]);

  // Address Book state
  const [addresses, setAddresses] = useState([
    {
      id: "addr-1",
      name: "Nguyễn Minh Khang",
      phone: "0912 345 678",
      address: "Số 88 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
      isDefault: true,
      type: "Nhà Riêng",
    },
    {
      id: "addr-2",
      name: "Nguyễn Minh Khang (Văn Phòng)",
      phone: "0912 345 678",
      address: "Tòa nhà Bitexco, Số 2 Hải Triều, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
      isDefault: false,
      type: "Văn Phòng",
    },
  ]);

  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    address: "",
    type: "Nhà Riêng",
    isDefault: false,
  });

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Vouchers state
  const [vouchers, setVouchers] = useState([
    { id: "v-1", code: "DOMIX50K", discount: 50000, minOrder: 300000, expiry: "31/12/2026", title: "Giảm 50K cho đơn từ 300K" },
    { id: "v-2", code: "FREESHIP", discount: 25000, minOrder: 50000, expiry: "31/12/2026", title: "Miễn phí vận chuyển toàn quốc" },
    { id: "v-3", code: "TECH100K", discount: 100000, minOrder: 1500000, expiry: "15/09/2026", title: "Voucher công nghệ giảm 100K" },
  ]);

  useEffect(() => {
    if (!user?.userId) return;
    userService.getUserProfile(user.userId).then((data) => {
      if (data) {
        const resolvedAvatar = data.url || data.avatar || user?.avatar || user?.url || profileData.avatar;
        setProfileData((prev) => ({
          ...prev,
          fullName: data.fullName || prev.fullName,
          email: data.email || prev.email,
          phoneNumber: data.phone || prev.phoneNumber,
          provider: data.provider || prev.provider || "LOCAL",
          avatar: resolvedAvatar,
        }));
        setSession({
          ...user,
          ...data,
          avatar: resolvedAvatar,
          url: resolvedAvatar,
        });
        setMainAvatarError(false);
        setSidebarAvatarError(false);
        if (Array.isArray(data.address) && data.address.length > 0) {
          setAddresses(
            data.address.map((a) => ({
              id: a.id || `addr-${Date.now()}`,
              name: a.fullName || data.fullName,
              phone: a.phone || data.phone,
              address: a.detail || `${a.ward || ""}, ${a.district || ""}, ${a.province || ""}`.trim(),
              isDefault: !!a.isDefault,
              type: "Nhà Riêng",
            }))
          );
        }
      }
    });

    couponService.getActiveCoupons().then((list) => {
      if (Array.isArray(list) && list.length > 0) {
        setVouchers(
          list.map((c) => ({
            id: c.id,
            code: c.code,
            discount: c.discountValue,
            minOrder: c.minOrderValue,
            expiry: c.endDate ? new Date(c.endDate).toLocaleDateString("vi-VN") : "31/12/2026",
            title: `Giảm ${formatCurrency(c.discountValue)} cho đơn từ ${formatCurrency(c.minOrderValue)}`,
          }))
        );
      }
    });
  }, [user?.userId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (user?.userId) {
      await userService.updateUserProfile(user.userId, {
        fullName: profileData.fullName,
        phone: profileData.phoneNumber,
        url: profileData.avatar,
      });
      setSession({
        ...user,
        fullName: profileData.fullName,
        phone: profileData.phoneNumber,
        avatar: profileData.avatar,
        url: profileData.avatar,
      });
    }
    showToast("Cập nhật thông tin hồ sơ thành công!");
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Dung lượng ảnh tối đa là 5 MB!");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setProfileData((prev) => ({ ...prev, avatar: previewUrl }));
    setMainAvatarError(false);
    setSidebarAvatarError(false);

    if (user?.userId) {
      try {
        setUploadingAvatar(true);
        const res = await userService.updateAvatar(user.userId, file);
        const serverAvatarUrl = res?.url || res?.avatar || previewUrl;
        setProfileData((prev) => ({ ...prev, avatar: serverAvatarUrl }));
        setSession({
          ...user,
          avatar: serverAvatarUrl,
          url: serverAvatarUrl,
        });
        showToast("Đã cập nhật ảnh đại diện thành công!");
      } catch (err) {
        console.warn("API upload avatar error, fallback to base64:", err);
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64Url = event.target.result;
          setProfileData((prev) => ({ ...prev, avatar: base64Url }));
          setSession({
            ...user,
            avatar: base64Url,
            url: base64Url,
          });
          try {
            await userService.updateUserProfile(user.userId, {
              fullName: profileData.fullName,
              phone: profileData.phoneNumber,
              url: base64Url,
            });
          } catch {}
          showToast("Đã lưu ảnh đại diện thành công!");
        };
        reader.readAsDataURL(file);
      } finally {
        setUploadingAvatar(false);
      }
    } else {
      showToast("Đã chọn ảnh đại diện!");
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.name || !addressForm.phone || !addressForm.address) {
      showToast("Vui lòng điền đủ thông tin địa chỉ!");
      return;
    }

    const payload = {
      fullName: addressForm.name,
      phone: addressForm.phone,
      detail: addressForm.address,
      province: "",
      district: "",
      ward: "",
      lat: null,
      lng: null,
      isDefault: !!addressForm.isDefault,
    };

    if (editingAddress) {
      if (user?.userId) {
        await userService.updateAddress(user.userId, editingAddress.id, payload);
      }
      setAddresses(
        addresses.map((a) =>
          a.id === editingAddress.id ? { ...a, ...addressForm } : a
        )
      );
      showToast("Đã cập nhật địa chỉ!");
    } else {
      if (user?.userId) {
        await userService.addAddress(user.userId, payload);
      }
      const newAddr = {
        id: `addr-${Date.now()}`,
        ...addressForm,
        isDefault: addresses.length === 0,
      };
      setAddresses([...addresses, newAddr]);
      showToast("Đã thêm địa chỉ nhận hàng mới!");
    }
    setAddressModalOpen(false);
    setEditingAddress(null);
  };

  const handleDeleteAddress = async (id) => {
    if (user?.userId) {
      await userService.deleteAddress(user.userId, id);
    }
    setAddresses(addresses.filter((a) => a.id !== id));
    showToast("Đã xóa địa chỉ!");
  };

  const handleSetDefaultAddress = async (id) => {
    setAddresses(
      addresses.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
    showToast("Đã đặt làm địa chỉ mặc định!");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("Mật khẩu mới không trùng khớp!");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    try {
      if (user?.userId) {
        await userService.changePassword(user.userId, {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        });
      }
      showToast("Đổi mật khẩu thành công!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      showToast(err.message || "Đổi mật khẩu thất bại!");
    }
  };

  return (
    <div className="page-shell">
      <Header />
      <SubNav activeTab="profile" />

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
          <CheckCircle size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="page-content">
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "240px 1fr",
              gap: "24px",
              alignItems: "start",
            }}
          >
            {/* Left Sidebar: User profile badge & nav items */}
            <aside
              className="card"
              style={{
                padding: "20px 16px",
                backgroundColor: "var(--surface)",
                borderRadius: "var(--r-lg)",
                border: "1px solid var(--border-light)",
              }}
            >
              {/* User Mini Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  paddingBottom: "16px",
                  borderBottom: "1px solid var(--border-light)",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    flexShrink: 0,
                    border: "2px solid var(--primary-light)",
                    backgroundColor: "var(--primary-light)",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      color: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      fontWeight: "800",
                    }}
                  >
                    {(profileData.fullName || user?.fullName || user?.name || user?.email || "U").charAt(0).toUpperCase()}
                  </div>
                  {!sidebarAvatarError && isValidAvatarUrl(profileData.avatar || user?.avatar || user?.url) && (
                    <img
                      src={profileData.avatar || user?.avatar || user?.url}
                      alt="Avatar"
                      onError={() => setSidebarAvatarError(true)}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "var(--text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {profileData.fullName}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    Sửa hồ sơ
                  </div>
                </div>
              </div>

              {/* Sidebar Menu Links */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {[
                  { id: "profile", label: "Hồ Sơ Của Tôi", icon: User },
                  { id: "addresses", label: "Địa Chỉ Nhận Hàng", icon: MapPin },
                  ...(!isGoogleUser ? [{ id: "password", label: "Đổi Mật Khẩu", icon: Lock }] : []),
                  { id: "vouchers", label: "Kho Voucher", icon: Ticket },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 12px",
                        borderRadius: "var(--r-sm)",
                        border: "none",
                        backgroundColor: isActive ? "var(--primary-light)" : "transparent",
                        color: isActive ? "var(--primary)" : "var(--text)",
                        fontWeight: isActive ? "700" : "500",
                        fontSize: "13px",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <Icon size={16} color={isActive ? "var(--primary)" : "var(--text-secondary)"} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <div style={{ height: "1px", backgroundColor: "var(--border-light)", margin: "8px 0" }} />

                <a
                  href="/orders"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "var(--r-sm)",
                    color: "var(--text)",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  <Package size={16} color="var(--text-secondary)" />
                  <span>Đơn Mua Của Tôi</span>
                </a>

                <a
                  href="/refunds"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "var(--r-sm)",
                    color: "var(--text)",
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  <RotateCcw size={16} color="var(--text-secondary)" />
                  <span>Trả Hàng & Hoàn Tiền</span>
                </a>
              </div>
            </aside>

            {/* Right Main Content */}
            <div>
              {/* TAB 1: PROFILE FORM */}
              {activeTab === "profile" && (
                <div
                  className="card"
                  style={{
                    padding: "28px",
                    backgroundColor: "var(--surface)",
                    borderRadius: "var(--r-lg)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <h2 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "4px" }}>
                    Hồ Sơ Của Tôi
                  </h2>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "24px" }}>
                    Quản lý thông tin hồ sơ để bảo mật tài khoản
                  </p>

                  <form
                    onSubmit={handleUpdateProfile}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 240px",
                      gap: "32px",
                      alignItems: "start",
                    }}
                  >
                    {/* Form fields */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                          Họ và Tên
                        </label>
                        <input
                          type="text"
                          value={profileData.fullName}
                          onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--r-sm)",
                            fontSize: "13px",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                          Email
                        </label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--r-sm)",
                            fontSize: "13px",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                          Số Điện Thoại
                        </label>
                        <input
                          type="tel"
                          value={profileData.phoneNumber}
                          onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--r-sm)",
                            fontSize: "13px",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                          Giới Tính
                        </label>
                        <div style={{ display: "flex", gap: "18px", fontSize: "13px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="gender"
                              checked={profileData.gender === "male"}
                              onChange={() => setProfileData({ ...profileData, gender: "male" })}
                              style={{ accentColor: "var(--primary)" }}
                            />
                            <span>Nam</span>
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="gender"
                              checked={profileData.gender === "female"}
                              onChange={() => setProfileData({ ...profileData, gender: "female" })}
                              style={{ accentColor: "var(--primary)" }}
                            />
                            <span>Nữ</span>
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="gender"
                              checked={profileData.gender === "other"}
                              onChange={() => setProfileData({ ...profileData, gender: "other" })}
                              style={{ accentColor: "var(--primary)" }}
                            />
                            <span>Khác</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>
                          Ngày Sinh
                        </label>
                        <input
                          type="date"
                          value={profileData.birthDate}
                          onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--r-sm)",
                            fontSize: "13px",
                          }}
                        />
                      </div>

                      <Button variant="primary" type="submit" style={{ width: "fit-content", marginTop: "8px" }}>
                        Lưu Thay Đổi
                      </Button>
                    </div>

                    {/* Avatar Upload */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        borderLeft: "1px solid var(--border-light)",
                        paddingLeft: "24px",
                      }}
                    >
                      <div style={{ position: "relative", marginBottom: "14px", width: "110px", height: "110px" }}>
                        <div
                          style={{
                            width: "110px",
                            height: "110px",
                            borderRadius: "50%",
                            backgroundColor: "var(--primary-light)",
                            color: "var(--primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "42px",
                            fontWeight: "800",
                            border: "3px solid var(--primary-light)",
                            overflow: "hidden",
                            position: "relative",
                          }}
                        >
                          {(profileData.fullName || user?.fullName || user?.name || user?.email || "U").charAt(0).toUpperCase()}
                          {!mainAvatarError && isValidAvatarUrl(profileData.avatar || user?.avatar || user?.url) && (
                            <img
                              src={profileData.avatar || user?.avatar || user?.url}
                              alt="Avatar Large"
                              onError={() => setMainAvatarError(true)}
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                opacity: uploadingAvatar ? 0.6 : 1,
                                transition: "all 0.2s",
                              }}
                            />
                          )}
                        </div>
                        <label
                          htmlFor="avatar-input"
                          style={{
                            position: "absolute",
                            bottom: "0",
                            right: "0",
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: "var(--primary)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: uploadingAvatar ? "not-allowed" : "pointer",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                          }}
                          title="Thay đổi ảnh đại diện"
                        >
                          {uploadingAvatar ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Camera size={16} />
                          )}
                          <input
                            id="avatar-input"
                            type="file"
                            accept="image/*"
                            disabled={uploadingAvatar}
                            onChange={handleAvatarChange}
                            style={{ display: "none" }}
                          />
                        </label>
                      </div>

                      <span style={{ fontSize: "12px", color: "var(--text-secondary)", textAlign: "center" }}>
                        {uploadingAvatar ? "Đang tải ảnh lên MinIO..." : "Dung lượng tối đa 5 MB"}
                        <br />
                        Định dạng: .JPEG, .PNG, .WEBP
                      </span>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: ADDRESS BOOK */}
              {activeTab === "addresses" && (
                <div
                  className="card"
                  style={{
                    padding: "28px",
                    backgroundColor: "var(--surface)",
                    borderRadius: "var(--r-lg)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "20px",
                      paddingBottom: "16px",
                      borderBottom: "1px solid var(--border-light)",
                    }}
                  >
                    <div>
                      <h2 style={{ fontSize: "18px", fontWeight: "800" }}>Địa Chỉ Của Tôi</h2>
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        Quản lý các địa chỉ giao hàng nhận hàng
                      </p>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      icon={Plus}
                      onClick={() => {
                        setEditingAddress(null);
                        setAddressForm({
                          name: "",
                          phone: "",
                          address: "",
                          type: "Nhà Riêng",
                          isDefault: false,
                        });
                        setAddressModalOpen(true);
                      }}
                    >
                      Thêm Địa Chỉ Mới
                    </Button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        style={{
                          padding: "16px",
                          borderRadius: "var(--r-md)",
                          border: addr.isDefault ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                          backgroundColor: addr.isDefault ? "var(--primary-subtle)" : "var(--surface)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "16px",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <strong style={{ fontSize: "14px" }}>{addr.name}</strong>
                            <span style={{ color: "var(--text-tertiary)" }}>|</span>
                            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{addr.phone}</span>
                            <span
                              style={{
                                fontSize: "11px",
                                padding: "1px 6px",
                                borderRadius: "3px",
                                backgroundColor: "var(--surface-muted)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              {addr.type}
                            </span>
                            {addr.isDefault && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  backgroundColor: "var(--primary)",
                                  color: "#fff",
                                  padding: "1px 6px",
                                  borderRadius: "3px",
                                  fontWeight: "700",
                                }}
                              >
                                Mặc định
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                            {addr.address}
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => {
                                setEditingAddress(addr);
                                setAddressForm(addr);
                                setAddressModalOpen(true);
                              }}
                              style={{ fontSize: "12px", color: "var(--info)", fontWeight: "600" }}
                            >
                              Cập nhật
                            </button>
                            {!addr.isDefault && (
                              <button
                                onClick={() => handleDeleteAddress(addr.id)}
                                style={{ fontSize: "12px", color: "var(--error)", fontWeight: "600" }}
                              >
                                Xóa
                              </button>
                            )}
                          </div>

                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              style={{
                                fontSize: "12px",
                                color: "var(--text-secondary)",
                                border: "1px solid var(--border)",
                                padding: "3px 8px",
                                borderRadius: "3px",
                                backgroundColor: "#fff",
                              }}
                            >
                              Thiết lập mặc định
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: PASSWORD */}
              {activeTab === "password" && !isGoogleUser && (
                <div
                  className="card"
                  style={{
                    padding: "28px",
                    backgroundColor: "var(--surface)",
                    borderRadius: "var(--r-lg)",
                    border: "1px solid var(--border-light)",
                    maxWidth: "500px",
                  }}
                >
                  <h2 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "4px" }}>
                    Đổi Mật Khẩu
                  </h2>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                    Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác
                  </p>

                  <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                        Mật Khẩu Hiện Tại
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-sm)" }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                        Mật Khẩu Mới
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-sm)" }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                        Xác Nhận Mật Khẩu Mới
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-sm)" }}
                        required
                      />
                    </div>
                    <Button variant="primary" type="submit" style={{ marginTop: "8px" }}>
                      Xác Nhận Đổi Mật Khẩu
                    </Button>
                  </form>
                </div>
              )}

              {/* TAB 4: VOUCHERS */}
              {activeTab === "vouchers" && (
                <div
                  className="card"
                  style={{
                    padding: "28px",
                    backgroundColor: "var(--surface)",
                    borderRadius: "var(--r-lg)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <h2 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "4px" }}>
                    Kho Voucher Của Tôi
                  </h2>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                    Các mã giảm giá sẵn sàng áp dụng khi thanh toán
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {vouchers.map((v) => (
                      <div
                        key={v.id}
                        style={{
                          border: "1px dashed var(--primary)",
                          borderRadius: "var(--r-md)",
                          padding: "16px",
                          backgroundColor: "var(--primary-light)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          position: "relative",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: "16px", color: "var(--primary)" }}>{v.code}</strong>
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(v.code);
                              showToast(`Đã sao chép mã ${v.code}!`);
                            }}
                            style={{
                              fontSize: "11px",
                              backgroundColor: "#fff",
                              color: "var(--primary)",
                              border: "1px solid var(--border-primary)",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontWeight: "700",
                              cursor: "pointer",
                            }}
                          >
                            Sao chép
                          </button>
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)" }}>
                          {v.title}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          Hạn sử dụng: {v.expiry}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Add/Edit Address */}
      <Modal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        title={editingAddress ? "Chỉnh Sửa Địa Chỉ" : "Thêm Địa Chỉ Mới"}
      >
        <form onSubmit={handleSaveAddress} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
              Họ và Tên:
            </label>
            <input
              type="text"
              value={addressForm.name}
              onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
              style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px" }}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
              Số Điện Thoại:
            </label>
            <input
              type="tel"
              value={addressForm.phone}
              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
              style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px" }}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
              Địa Chỉ Chi Tiết (Có gợi ý tìm kiếm bản đồ):
            </label>
            <AddressAutocomplete
              value={addressForm.address}
              onChange={(val) => setAddressForm({ ...addressForm, address: val })}
              onPlaceSelect={(place) => {
                setAddressForm((prev) => ({
                  ...prev,
                  address: place.formattedAddress || place.detail,
                  lat: place.lat,
                  lng: place.lng,
                }));
              }}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
              Loại Địa Chỉ:
            </label>
            <select
              value={addressForm.type}
              onChange={(e) => setAddressForm({ ...addressForm, type: e.target.value })}
              style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px", backgroundColor: "#fff" }}
            >
              <option value="Nhà Riêng">Nhà Riêng</option>
              <option value="Văn Phòng">Văn Phòng / Công Ty</option>
            </select>
          </div>
          <Button variant="primary" type="submit" block style={{ marginTop: "8px" }}>
            Lưu Địa Chỉ
          </Button>
        </form>
      </Modal>

      <Footer />
      <MobileNav />
    </div>
  );
}