package com.example.backend.service.impl;


import com.example.backend.DTO.user.ChangePasswordRequest;
import com.example.backend.DTO.user.UserResponse;
import com.example.backend.DTO.user.UserUpdateRequest;
import com.example.backend.module.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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
        user.setAddresses(request.getAddress());
        user.setLat(request.getLat());
        user.setLng(request.getLng());

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    @Override
    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = findUserOrThrow(userId);

        if (user.getPassword() == null) {
            throw new IllegalStateException("Tài khoản đăng nhập bằng Google, không thể đổi mật khẩu tại đây");
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không đúng");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
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
        return response;
    }
}