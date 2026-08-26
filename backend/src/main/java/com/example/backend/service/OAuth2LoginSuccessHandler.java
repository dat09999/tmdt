package com.example.backend.service;

import com.example.backend.module.User;
import com.example.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {
    @Value("${app.frontend-url}")
    private String frontendUrl;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String providerId = oAuth2User.getAttribute("sub");

        if (email == null || email.isBlank()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Không lấy được email từ Google");
            return;
        }

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            user = User.builder()
                    .email(email)
                    .password(null)
                    .fullName(name)
                    .role("USER")
                    .provider("GOOGLE")
                    .providerId(providerId)
                    .active(true)
                    .build();
        } else {
            if (Boolean.FALSE.equals(user.getActive())) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Tài khoản đã bị khóa");
                return;
            }

            if (user.getFullName() == null || user.getFullName().isBlank()) {
                user.setFullName(name);
            }

            if (user.getProvider() == null || user.getProvider().isBlank()) {
                user.setProvider("GOOGLE");
            }

            if (user.getProviderId() == null || user.getProviderId().isBlank()) {
                user.setProviderId(providerId);
            }
        }

        user = userRepository.save(user);

        // KHÔNG sinh/gắn accessToken vào URL nữa.
        // Chỉ cần sinh refreshToken và set vào HttpOnly cookie.
        // FE sau khi redirect về sẽ tự gọi /auth/refresh để lấy accessToken,
        // dùng chung 1 luồng với lúc F5 trang -- accessToken không bao giờ
        // đi qua URL, giảm nguy cơ lộ qua lịch sử trình duyệt / extension.
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(true)      // localhost test HTTP thì false, production HTTPS thì true
                .sameSite("None")
                .path("/auth")
                .maxAge(7 * 24 * 60 * 60)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        // Redirect về FE mà KHÔNG kèm token trong URL
        String redirectUrl = frontendUrl + "/oauth2/success";
        response.sendRedirect(redirectUrl);
    }
}