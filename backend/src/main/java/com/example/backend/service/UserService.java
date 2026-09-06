package com.example.backend.service;



import com.example.backend.DTO.place.AddressRequest;
import com.example.backend.DTO.user.ChangePasswordRequest;
import com.example.backend.DTO.user.UserResponse;
import com.example.backend.DTO.user.UserUpdateRequest;

public interface UserService {

    // Lấy thông tin user theo id — dùng cho GET /api/users/{userId}
    UserResponse getUserById(String userId);

    // Lấy theo email — hữu ích khi xử lý JWT/OAuth2 login, tìm user theo email trong token
    UserResponse getUserByEmail(String email);

    // Cập nhật fullName, phone, address, lat, lng — dùng cho PUT /api/users/{userId}
    UserResponse updateUser(String userId, UserUpdateRequest request);

    // Đổi mật khẩu — verify currentPassword trước khi set newPassword
    void changePassword(String userId, ChangePasswordRequest request);

    // Kiểm tra email đã tồn tại chưa — dùng khi Register hoặc validate khi đổi email
    boolean existsByEmail(String email);

    // Vô hiệu hóa tài khoản (khác xóa cứng) — hữu ích cho admin/soft-delete sau này
    void deactivateUser(String userId);
    UserResponse addAddress(String userId, AddressRequest request);
    UserResponse updateAddress(String userId, String addressId, AddressRequest request);
    UserResponse deleteAddress(String userId, String addressId);
    UserResponse updateAvatar(String userId, org.springframework.web.multipart.MultipartFile file);

    // Admin methods
    org.springframework.data.domain.Page<UserResponse> getAllUsers(Boolean active, String provider, String keyword, org.springframework.data.domain.Pageable pageable);
    UserResponse updateUserStatus(String userId, boolean active);
}