package com.example.backend.sercurity;

import com.example.backend.module.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.JwtService;
import com.example.backend.service.TokenBlacklistService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final TokenBlacklistService tokenBlacklistService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String jwt = authHeader.substring(7);
            String jti = jwtService.extractJti(jwt);

            // 1. Kiểm tra Blacklist (MongoDB TTL)
            if (tokenBlacklistService.isBlacklisted(jwt, jti)) {
                filterChain.doFilter(request, response);
                return;
            }

            String email = jwtService.extractUsername(jwt);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // 2. Kiểm tra Token Version (nếu đổi mật khẩu hoặc đăng xuất hết thiết bị)
                Integer tokenVersion = jwtService.extractTokenVersion(jwt);
                User user = userRepository.findByEmail(email).orElse(null);
                if (user != null && tokenVersion != null) {
                    int currentVersion = user.getTokenVersion() != null ? user.getTokenVersion() : 1;
                    if (tokenVersion < currentVersion) {
                        // Token đã bị thu hồi do đổi mật khẩu / phiên đăng nhập cũ
                        filterChain.doFilter(request, response);
                        return;
                    }
                }

                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                if (jwtService.isTokenValid(jwt, userDetails.getUsername())) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception ignored) {
            // token lỗi thì bỏ qua, request sẽ bị chặn ở SecurityConfig nếu endpoint cần auth
        }

        filterChain.doFilter(request, response);
    }
}