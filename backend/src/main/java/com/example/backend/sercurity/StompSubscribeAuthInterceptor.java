package com.example.backend.sercurity;

import com.example.backend.module.Conversation;
import com.example.backend.module.Shop;
import com.example.backend.repository.ConversationRepository;
import com.example.backend.repository.ShopRepository;
import com.example.backend.service.impl.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;  // ✅
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class StompSubscribeAuthInterceptor implements ChannelInterceptor {

    private final ConversationRepository conversationRepository;
    private final ShopRepository shopRepository;

    private static final String TOPIC_PREFIX = "/topic/conversations/";

    @Override
    public Message<?> preSend(@NotNull Message<?> message, @NotNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || !StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            return message;
        }

        String destination = accessor.getDestination();
        if (destination == null || !destination.startsWith(TOPIC_PREFIX)) {
            return message;
        }

        if (accessor.getUser() == null) {
            throw new MessagingException("Bạn cần đăng nhập để subscribe");
        }

        UserPrincipal principal = (UserPrincipal)
                ((UsernamePasswordAuthenticationToken) accessor.getUser()).getPrincipal();

        String remainder = destination.substring(TOPIC_PREFIX.length());
        String conversationId = remainder.split("/")[0];

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new MessagingException("Không tìm thấy đoạn chat"));

        boolean isBuyer = conversation.getUserId().equals(principal.getId());
        boolean isShopOwner = false;

        if (!isBuyer) {
            Shop shop = shopRepository.findById(conversation.getShopId()).orElse(null);
            isShopOwner = shop != null && shop.getOwnerId().equals(principal.getId());
        }

        if (!isBuyer && !isShopOwner) {
            log.warn("User {} cố subscribe conversation {} không thuộc về mình", principal.getId(), conversationId);
            throw new MessagingException("Bạn không có quyền theo dõi đoạn chat này");
        }

        return message;
    }
}