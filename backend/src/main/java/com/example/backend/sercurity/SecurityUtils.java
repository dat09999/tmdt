package com.example.backend.sercurity;

import com.example.backend.Exception.UnauthorizedException;
import com.example.backend.service.impl.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    public static UserPrincipal getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()
                || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            throw new UnauthorizedException("Bạn cần đăng nhập để thực hiện thao tác này");
        }

        return principal;
    }

    public static String getCurrentUserId() {
        return getCurrentUser().getId();
    }

    public static boolean isAdmin() {
        try {
            UserPrincipal principal = getCurrentUser();
            return "ADMIN".equalsIgnoreCase(principal.getRole());
        } catch (Exception e) {
            return false;
        }
    }
}