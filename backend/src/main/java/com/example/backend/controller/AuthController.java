package com.example.backend.controller;

import com.example.backend.DTO.auth.LoginRequest;
import com.example.backend.DTO.auth.RegisterRequest;
import com.example.backend.DTO.common.AddressRequest;
import com.example.backend.Exception.EmailAlreadyExistsException;
import com.example.backend.module.Address;
import com.example.backend.module.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        log.info(request.getEmail(),request.getPassword());
        log.info("dang nhap");

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        if (!Boolean.TRUE.equals(user.getActive())) {
            return ResponseEntity.status(403).body("Tài khoản đã bị khóa");
        }

        String accessToken = jwtService.generateAccessToken(
                Map.of(
                        "userId", user.getId(),
                        "role", user.getRole()
                ),
                user.getEmail()
        );

        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(true) // localhost test HTTP thì để false, production HTTPS thì phải true
                .path("/auth")
                .sameSite("None") // nếu frontend/backend khác site thì thường phải là "None"
                .maxAge(7 * 24 * 60 * 60)
                .build();
        log.info("dang nhap 1");
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(Map.of(
                        "accessToken", accessToken,
                        "userId", user.getId(),
                        "email", user.getEmail(),
                        "role", user.getRole()
                ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail().trim()).isPresent()) {
            throw new EmailAlreadyExistsException("Email đã tồn tại");
        }



        User user = User.builder()
                .email(request.getEmail().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .phone(request.getPhone().trim())
                .role("USER")
                .provider("LOCAL")
                .providerId(null)
                .active(true)

                .build();

        User savedUser = userRepository.save(user);
        log.info("da vao controller");
        return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of(
                        "message", "Tạo tài khoản thành công",
                        "id", savedUser.getId(),
                        "email", savedUser.getEmail(),
                        "fullName", savedUser.getFullName(),
                        "phone", savedUser.getPhone(),
                        "role", savedUser.getRole(),
                        "provider", savedUser.getProvider(),
                        "active", savedUser.getActive(),
                        "addresses", savedUser.getAddresses() == null ? List.of() : savedUser.getAddresses()
                )
        );
    }
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(
            @CookieValue(value = "refreshToken", required = false) String refreshToken
    ) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401).body("Không có refresh token");
        }

        String email;
        try {
            email = jwtService.extractUsername(refreshToken);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Refresh token không hợp lệ");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        if (!jwtService.isRefreshToken(refreshToken)) {
            return ResponseEntity.status(401).body("Sai loại token");
        }

        if (!jwtService.isTokenValid(refreshToken, user.getEmail())) {
            return ResponseEntity.status(401).body("Refresh token hết hạn hoặc không hợp lệ");
        }

        String newAccessToken = jwtService.generateAccessToken(
                Map.of(
                        "userId", user.getId(),
                        "role", user.getRole()
                ),
                user.getEmail()
        );

        return ResponseEntity.ok(Map.of(
                "accessToken", newAccessToken,
                "userId", user.getId(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "role", user.getRole()
        ));
    }
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        ResponseCookie deleteCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(true) // production: true
                .path("/auth")
                .sameSite("None")
                .maxAge(0)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                .body(Map.of("message", "Đăng xuất thành công"));
    }
    private Address toAddress(AddressRequest request) {
        return Address.builder()
                .fullName(request.getFullName().trim())
                .phone(request.getPhone().trim())
                .province(request.getProvince().trim())
                .district(request.getDistrict().trim())
                .ward(request.getWard().trim())
                .detail(request.getDetail().trim())
                .isDefault(request.getIsDefault() != null ? request.getIsDefault() : false)
                .build();
    }
}
