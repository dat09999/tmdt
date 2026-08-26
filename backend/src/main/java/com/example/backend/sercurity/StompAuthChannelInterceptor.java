    package com.example.backend.sercurity;

    import com.example.backend.module.User;
    import com.example.backend.repository.UserRepository;
    import com.example.backend.service.JwtService;
    import com.example.backend.service.impl.UserPrincipal;
    import lombok.RequiredArgsConstructor;
    import org.springframework.messaging.MessagingException;  // ✅
    import lombok.extern.slf4j.Slf4j;
    import org.jetbrains.annotations.NotNull;
    import org.springframework.messaging.Message;
    import org.springframework.messaging.MessageChannel;

    import org.springframework.messaging.simp.stomp.StompCommand;
    import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
    import org.springframework.messaging.support.ChannelInterceptor;
    import org.springframework.messaging.support.MessageHeaderAccessor;
    import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
    import org.springframework.stereotype.Component;

    import java.security.Principal;

    @Component
    @Slf4j
    @RequiredArgsConstructor
    public class StompAuthChannelInterceptor implements ChannelInterceptor {

        private final JwtService jwtService;
        private final UserRepository userRepository;

        @Override
        public Message<?> preSend(@NotNull Message<?> message, @NotNull MessageChannel channel) {
            StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
            if (accessor == null) return message;

            if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                String authHeader = accessor.getFirstNativeHeader("Authorization");

                if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                    throw new MessagingException("Thiếu token xác thực khi kết nối WebSocket");
                }

                try {
                    String jwt = authHeader.substring(7);
                    String email = jwtService.extractUsername(jwt);

                    User user = userRepository.findByEmail(email)
                            .orElseThrow(() -> new RuntimeException("User không tồn tại"));

                    if (!jwtService.isTokenValid(jwt, user.getEmail())) {
                        throw new RuntimeException("Token không hợp lệ hoặc đã hết hạn");
                    }

                    UserPrincipal principal = new UserPrincipal(user);
                    Principal authToken = new UsernamePasswordAuthenticationToken(
                            principal, null, principal.getAuthorities());

                    accessor.setUser(authToken);
                    log.info("WebSocket CONNECT thành công: userId={}", principal.getId());

                } catch (Exception ex) {
                    log.warn("WebSocket CONNECT bị từ chối: {}", ex.getMessage());
                    throw new MessagingException("Xác thực thất bại: " + ex.getMessage());
                }
            }

            return message;
        }
    }