package com.example.backend.controller.admin;

import com.example.backend.DTO.admin.AdminBroadcastNotificationRequest;
import com.example.backend.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class AdminNotificationControllerTest {

    private MockMvc mockMvc;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private AdminNotificationController adminNotificationController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminNotificationController).build();
    }

    @Test
    void testBroadcastNotification_Success() throws Exception {
        AdminBroadcastNotificationRequest req = AdminBroadcastNotificationRequest.builder()
                .all(true)
                .title("Thông báo bảo trì hệ thống")
                .message("Hệ thống sẽ bảo trì từ 0h đến 1h")
                .type("SYSTEM")
                .build();

        when(notificationService.broadcastNotification(any())).thenReturn(100);

        mockMvc.perform(post("/admin/notifications/broadcast")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.sentCount").value(100));
    }
}
