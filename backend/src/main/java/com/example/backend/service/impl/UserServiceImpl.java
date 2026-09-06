package com.example.backend.service.impl;



import com.example.backend.DTO.place.AddressRequest;
import com.example.backend.DTO.user.ChangePasswordRequest;
import com.example.backend.DTO.user.UserResponse;
import com.example.backend.DTO.user.UserUpdateRequest;
import com.example.backend.Exception.NotFoundException;
import com.example.backend.module.Address;
import com.example.backend.module.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectStorageService objectStorageService;

    @org.springframework.beans.factory.annotation.Value("${minio.bucket-user:user-images}")
    private String userBucket;

    @Override
    public UserResponse getUserById(String userId) {
        User user = findUserOrThrow(userId);
        return toResponse(user);
    }

    @Override
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với email: " + email));
        return toResponse(user);
    }

    @Override
    public UserResponse updateUser(String userId, UserUpdateRequest request) {
        User user = findUserOrThrow(userId);

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        if (request.getUrl() != null) {
            user.setUrl(request.getUrl());
        }

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    @Override
    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = findUserOrThrow(userId);

        if ("GOOGLE".equalsIgnoreCase(user.getProvider()) || user.getPassword() == null || user.getPassword().isBlank()) {
            throw new IllegalArgumentException("Tài khoản đăng nhập bằng Google không có mật khẩu, không thể thực hiện đổi mật khẩu");
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không đúng");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setTokenVersion((user.getTokenVersion() != null ? user.getTokenVersion() : 1) + 1);
        userRepository.save(user);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public void deactivateUser(String userId) {
        User user = findUserOrThrow(userId);
        user.setActive(false);
        userRepository.save(user);
    }

    private User findUserOrThrow(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với id: " + userId));
    }

    private UserResponse toResponse(User user) {
        UserResponse response = new UserResponse();
        response.setUserId(user.getId());
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setAddress(user.getAddresses());
        response.setLat(user.getLat());
        response.setLng(user.getLng());
        response.setActive(user.getActive());
        response.setProvider(user.getProvider() == null ? "LOCAL" : user.getProvider());

        String avatarUrl = user.getUrl();
        if (avatarUrl != null && !avatarUrl.isBlank()) {
            if (!avatarUrl.startsWith("http://") && !avatarUrl.startsWith("https://") && !avatarUrl.startsWith("data:")) {
                try {
                    avatarUrl = objectStorageService.getPublicUrlOrSignedUrl(userBucket, avatarUrl);
                } catch (Exception ignored) {
                    avatarUrl = "";
                }
            }
        }
        response.setUrl((avatarUrl != null && (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://") || avatarUrl.startsWith("data:"))) ? avatarUrl : "");
        return response;
    }

    @Override
    public UserResponse updateAvatar(String userId, org.springframework.web.multipart.MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File ảnh không được để trống");
        }

        User user = findUserOrThrow(userId);

        try {
            String originalName = file.getOriginalFilename();
            String key = "user/" + userId + "/" + java.util.UUID.randomUUID() + "_" + (originalName != null ? originalName : "avatar.jpg");

            objectStorageService.putObject(userBucket, key, file);

            user.setUrl(key);
            User saved = userRepository.save(user);
            return toResponse(saved);
        } catch (Exception e) {
            throw new RuntimeException("Cập nhật ảnh đại diện thất bại: " + e.getMessage(), e);
        }
    }
    @Override
    public UserResponse addAddress(String userId, AddressRequest request) {
        User user = findUserOrThrow(userId);

        Address address = Address.builder()
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .province(request.getProvince())
                .district(request.getDistrict())
                .ward(request.getWard())
                .detail(request.getDetail())
                .lat(request.getLat())
                .lng(request.getLng())
                .isDefault(Boolean.TRUE.equals(request.getIsDefault()))
                .build();

        List<Address> addresses = user.getAddresses();
        if (addresses == null) {
            addresses = new ArrayList<>();
        }

        // nếu địa chỉ mới được đặt làm mặc định, bỏ mặc định ở các địa chỉ khác
        if (Boolean.TRUE.equals(address.getIsDefault())) {
            addresses.forEach(a -> a.setIsDefault(false));
        }

        addresses.add(address);
        user.setAddresses(addresses);
        userRepository.save(user);
        return toResponse(user);
    }

    @Override
    public UserResponse updateAddress(String userId, String addressId, AddressRequest request) {
        User user = findUserOrThrow(userId);
        List<Address> addresses = user.getAddresses();

        if (addresses == null) {
            throw new NotFoundException("Không tìm thấy địa chỉ");
        }

        boolean wantsDefault = Boolean.TRUE.equals(request.getIsDefault());

        for (Address a : addresses) {
            if (a.getId().equals(addressId)) {
                a.setFullName(request.getFullName());
                a.setPhone(request.getPhone());
                a.setProvince(request.getProvince());
                a.setDistrict(request.getDistrict());
                a.setWard(request.getWard());
                a.setDetail(request.getDetail());
                a.setLat(request.getLat());
                a.setLng(request.getLng());
                a.setIsDefault(wantsDefault);
            } else if (wantsDefault) {
                a.setIsDefault(false);
            }
        }

        userRepository.save(user);
        return toResponse(user);
    }

    @Override
    public UserResponse deleteAddress(String userId, String addressId) {
        User user = findUserOrThrow(userId);
        List<Address> addresses = user.getAddresses();

        if (addresses != null) {
            addresses.removeIf(a -> a.getId().equals(addressId));
            user.setAddresses(addresses);
            userRepository.save(user);
        }

        return toResponse(user);
    }

}