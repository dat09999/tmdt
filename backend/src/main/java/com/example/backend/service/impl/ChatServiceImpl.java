package com.example.backend.service.impl;


import com.example.backend.DTO.message.ConversationResponse;
import com.example.backend.DTO.message.MessageRequest;
import com.example.backend.DTO.message.MessageResponse;
import com.example.backend.Exception.ForbiddenException;
import com.example.backend.Exception.NotFoundException;
import com.example.backend.module.Conversation;
import com.example.backend.module.Message;
import com.example.backend.module.Shop;
import com.example.backend.repository.ConversationRepository;
import com.example.backend.repository.MessageRepository;
import com.example.backend.repository.ShopRepository;
import com.example.backend.sercurity.SecurityUtils;
import com.example.backend.service.ChatService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ShopRepository shopRepository;
    private final ObjectStorageService objectStorageService;
    private final MongoTemplate mongoTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${minio.bucket-name}")
    private String imageBucket;

    private static final int MAX_IMAGES_PER_MESSAGE = 5;
    private static final long MAX_IMAGE_SIZE_BYTES = 5L * 1024 * 1024;
    private static final List<String> ALLOWED_IMAGE_TYPES = List.of("image/jpeg", "image/png", "image/webp");

    private record SenderContext(String senderId, String senderRole) {}

    // ================== CONVERSATION ==================

    @Override
    public ConversationResponse getOrCreateConversation(String shopId) {
        String userId = SecurityUtils.getCurrentUserId();

        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy shop"));

        if (!"ACTIVE".equalsIgnoreCase(shop.getStatus())) {
            throw new RuntimeException("Shop hiện không hoạt động, không thể nhắn tin");
        }

        Conversation conversation = conversationRepository
                .findByUserIdAndShopId(userId, shopId)
                .orElseGet(() -> conversationRepository.save(
                        Conversation.builder()
                                .userId(userId)
                                .shopId(shopId)
                                .unreadCountForUser(0)
                                .unreadCountForShop(0)
                                .createdAt(new Date())
                                .build()
                ));

        return toConversationResponse(conversation, shop);
    }

    @Override
    public List<ConversationResponse> getConversationsByUser() {
        String userId = SecurityUtils.getCurrentUserId();
        return conversationRepository.findByUserIdOrderByLastMessageAtDesc(userId)
                .stream()
                .map(c -> toConversationResponse(c, shopRepository.findById(c.getShopId()).orElse(null)))
                .toList();
    }

    @Override
    public Page<ConversationResponse> getConversationsByUser(int page, int size) {
        String userId = SecurityUtils.getCurrentUserId();
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by("lastMessageAt").descending());
        return conversationRepository.findByUserId(userId, pageable)
                .map(c -> toConversationResponse(c, shopRepository.findById(c.getShopId()).orElse(null)));
    }

    @Override
    public List<ConversationResponse> getConversationsByShop(String shopId) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy shop"));

        if (!shop.getOwnerId().equals(SecurityUtils.getCurrentUserId())) {
            throw new ForbiddenException("Bạn không phải chủ shop này");
        }

        return conversationRepository.findByShopIdOrderByLastMessageAtDesc(shopId)
                .stream()
                .map(c -> toConversationResponse(c, shop))
                .toList();
    }

    @Override
    public Page<ConversationResponse> getConversationsByShop(String shopId, int page, int size) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy shop"));

        if (!shop.getOwnerId().equals(SecurityUtils.getCurrentUserId())) {
            throw new ForbiddenException("Bạn không phải chủ shop này");
        }

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by("lastMessageAt").descending());
        return conversationRepository.findByShopId(shopId, pageable)
                .map(c -> toConversationResponse(c, shop));
    }

    /**
     * Xác định người gọi API là "USER" (buyer trong conversation) hay "SHOP" (chủ shop
     * của conversation), dựa vào userId lấy từ JWT - KHÔNG tin client tự khai senderId/
     * senderRole. Nếu người này không thuộc conversation ở vai trò nào -> chặn Forbidden.
     */
    private SenderContext resolveSender(Conversation conversation, String currentUserId) {
        if (conversation.getUserId().equals(currentUserId)) {
            return new SenderContext(currentUserId, "USER");
        }

        Shop shop = shopRepository.findById(conversation.getShopId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy shop"));

        if (shop.getOwnerId().equals(currentUserId)) {
            return new SenderContext(conversation.getShopId(), "SHOP");
        }

        throw new ForbiddenException("Bạn không thuộc đoạn chat này");
    }

    // ================== MESSAGE ==================

    @Override
    public MessageResponse sendMessage(MessageRequest request) {
        Conversation conversation = getConversationEntity(request.getConversationId());
        SenderContext sender = resolveSender(conversation, SecurityUtils.getCurrentUserId());

        boolean hasText = request.getContent() != null && !request.getContent().isBlank();
        boolean hasImages = request.getImages() != null && !request.getImages().isEmpty();

        if (!hasText && !hasImages) {
            throw new RuntimeException("Tin nhắn phải có nội dung hoặc ảnh");
        }

        validateImages(request.getImages());
        List<String> imageKeys = uploadImages(conversation.getId(), request.getImages());

        Message message = Message.builder()
                .conversationId(conversation.getId())
                .senderId(sender.senderId())
                .senderRole(sender.senderRole())
                .content(hasText ? request.getContent().trim() : null)
                .imageKeys(imageKeys)
                .isRead(false)
                .deleted(false)
                .sentAt(new Date())
                .build();

        Message saved = messageRepository.save(message);

        String preview = hasText ? truncate(request.getContent().trim(), 100) : "[Hình ảnh]";
        updateConversationAfterMessage(conversation.getId(), preview,
                hasImages ? "IMAGE" : "TEXT", sender.senderRole());

        MessageResponse response = toMessageResponse(saved);
        messagingTemplate.convertAndSend("/topic/conversations/" + conversation.getId(), response);
        return response;
    }

    @Override
    public Page<MessageResponse> getMessages(String conversationId, int page, int size) {
        Conversation conversation = getConversationEntity(conversationId);
        resolveSender(conversation, SecurityUtils.getCurrentUserId());

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "sentAt"));
        return messageRepository.findByConversationIdAndDeletedFalse(conversationId, pageable)
                .map(this::toMessageResponse);
    }

    @Override
    public void markConversationAsRead(String conversationId) {
        Conversation conversation = getConversationEntity(conversationId);
        SenderContext sender = resolveSender(conversation, SecurityUtils.getCurrentUserId());

        String unreadField = "USER".equals(sender.senderRole()) ? "unreadCountForUser" : "unreadCountForShop";
        String otherRole = "USER".equals(sender.senderRole()) ? "SHOP" : "USER";

        mongoTemplate.updateFirst(
                Query.query(Criteria.where("id").is(conversationId)),
                new Update().set(unreadField, 0),
                Conversation.class
        );

        mongoTemplate.updateMulti(
                Query.query(Criteria.where("conversationId").is(conversationId)
                        .and("senderRole").is(otherRole)
                        .and("isRead").is(false)),
                new Update().set("isRead", true),
                Message.class
        );

        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId + "/read", sender.senderRole());
    }

    @Override
    public long countUnreadConversations() {
        String userId = SecurityUtils.getCurrentUserId();
        Query query = Query.query(Criteria.where("userId").is(userId).and("unreadCountForUser").gt(0));
        return mongoTemplate.count(query, Conversation.class);
    }

    @Override
    public void deleteMessage(String messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy tin nhắn"));

        Conversation conversation = getConversationEntity(message.getConversationId());
        SenderContext sender = resolveSender(conversation, SecurityUtils.getCurrentUserId());

        if (!message.getSenderId().equals(sender.senderId())) {
            throw new ForbiddenException("Không có quyền xóa tin nhắn này");
        }

        message.setDeleted(true);
        message.setContent("[Tin nhắn đã bị thu hồi]");
        message.setImageKeys(new ArrayList<>());
        messageRepository.save(message);

        messagingTemplate.convertAndSend(
                "/topic/conversations/" + message.getConversationId() + "/deleted", messageId);
    }

    // ================== IMAGE HANDLING ==================

    private void validateImages(List<MultipartFile> images) {
        if (images == null || images.isEmpty()) return;

        if (images.size() > MAX_IMAGES_PER_MESSAGE) {
            throw new RuntimeException("Chỉ được gửi tối đa " + MAX_IMAGES_PER_MESSAGE + " ảnh mỗi tin nhắn");
        }

        for (MultipartFile file : images) {
            if (file == null || file.isEmpty()) continue;

            if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
                throw new RuntimeException("Ảnh " + file.getOriginalFilename() + " vượt quá 5MB");
            }

            String contentType = file.getContentType();
            if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
                throw new RuntimeException("Định dạng ảnh không hỗ trợ: " + file.getOriginalFilename());
            }
        }
    }

    private List<String> uploadImages(String conversationId, List<MultipartFile> images) {
        if (images == null || images.isEmpty()) return new ArrayList<>();

        List<String> keys = new ArrayList<>();
        for (MultipartFile file : images) {
            if (file == null || file.isEmpty()) continue;

            String key = generateImageKey(conversationId, file);

            try {
                objectStorageService.putObject(imageBucket, key, file);
            } catch (Exception e) {
                log.error("Upload ảnh chat thất bại: {}", file.getOriginalFilename(), e);
                throw new RuntimeException("Upload ảnh thất bại: " + file.getOriginalFilename());
            }

            keys.add(key);
        }
        return keys;
    }

    private String generateImageKey(String conversationId, MultipartFile file) {
        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            originalName = "image";
        }

        return "chat"
                + "/" + conversationId
                + "/" + UUID.randomUUID()
                + "_" + originalName;
    }

    // ================== ATOMIC UPDATE ==================

    private void updateConversationAfterMessage(String conversationId, String preview,
                                                String type, String senderRole) {
        String unreadField = "SHOP".equals(senderRole) ? "unreadCountForUser" : "unreadCountForShop";

        Query query = Query.query(Criteria.where("id").is(conversationId));
        Update update = new Update()
                .set("lastMessage", preview)
                .set("lastMessageType", type)
                .set("lastMessageAt", new Date())
                .inc(unreadField, 1);

        mongoTemplate.updateFirst(query, update, Conversation.class);
    }

    // ================== HELPERS ==================

    private Conversation getConversationEntity(String conversationId) {
        return conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đoạn chat"));
    }

    private String truncate(String text, int maxLen) {
        return text.length() <= maxLen ? text : text.substring(0, maxLen) + "...";
    }

    // ================== MAPPERS ==================

    private ConversationResponse toConversationResponse(Conversation c, Shop shop) {
        return ConversationResponse.builder()
                .id(c.getId())
                .userId(c.getUserId())
                .shopId(c.getShopId())
                .shopName(shop != null ? shop.getShopName() : null)
                .lastMessage(c.getLastMessage())
                .lastMessageType(c.getLastMessageType())
                .lastMessageAt(c.getLastMessageAt())
                .unreadCountForUser(c.getUnreadCountForUser())
                .unreadCountForShop(c.getUnreadCountForShop())
                .build();
    }

    private MessageResponse toMessageResponse(Message m) {
        List<String> urls = m.getImageKeys() == null ? List.of() :
                m.getImageKeys().stream()
                        .map(key -> objectStorageService.getPublicUrlOrSignedUrl(imageBucket, key))
                        .toList();

        return MessageResponse.builder()
                .id(m.getId())
                .conversationId(m.getConversationId())
                .senderId(m.getSenderId())
                .senderRole(m.getSenderRole())
                .content(m.getContent())
                .imageUrls(urls)
                .isRead(m.isRead())
                .sentAt(m.getSentAt())
                .build();
    }
}