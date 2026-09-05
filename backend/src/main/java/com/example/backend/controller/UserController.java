package com.example.backend.controller;



import com.example.backend.DTO.place.AddressRequest;
import com.example.backend.DTO.user.ChangePasswordRequest;
import com.example.backend.DTO.user.UserResponse;
import com.example.backend.DTO.user.UserUpdateRequest;
import com.example.backend.Exception.BadRequestException;
import com.example.backend.Exception.UnauthorizedException;
import com.example.backend.service.UserService;
import com.example.backend.service.impl.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {
//hello
    private final UserService userService;

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUser(
            @PathVariable String userId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireSelf(userId, principal);
        log.info("thông tin user ");
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable String userId,
            @RequestBody UserUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireSelf(userId, principal);
        return ResponseEntity.ok(userService.updateUser(userId, request));
    }

    @PutMapping("/{userId}/password")
    public ResponseEntity<Void> changePassword(
            @PathVariable String userId,
            @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireSelf(userId, principal);
        if ("GOOGLE".equalsIgnoreCase(principal.getProvider())) {
            throw new BadRequestException("Tài khoản đăng nhập bằng Google không thể đổi mật khẩu");
        }
        userService.changePassword(userId, request);
        return ResponseEntity.ok().build();
    }
    @PostMapping("/{userId}/addresses")
    public ResponseEntity<UserResponse> addAddress(
            @PathVariable String userId,
            @RequestBody AddressRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireSelf(userId, principal);
        return ResponseEntity.ok(userService.addAddress(userId, request));
    }

    @PutMapping("/{userId}/addresses/{addressId}")
    public ResponseEntity<UserResponse> updateAddress(
            @PathVariable String userId,
            @PathVariable String addressId,
            @RequestBody AddressRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireSelf(userId, principal);
        return ResponseEntity.ok(userService.updateAddress(userId, addressId, request));
    }

    @DeleteMapping("/{userId}/addresses/{addressId}")
    public ResponseEntity<UserResponse> deleteAddress(
            @PathVariable String userId,
            @PathVariable String addressId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        requireSelf(userId, principal);
        return ResponseEntity.ok(userService.deleteAddress(userId, addressId));
    }
    private void requireSelf(String userId, UserPrincipal principal) {
        if (principal == null || !principal.getId().equals(userId)) {
            throw new UnauthorizedException("Không có quyền truy cập thông tin người dùng này");
        }
    }
}