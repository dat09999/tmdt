package com.example.backend.controller.admin;

import com.example.backend.DTO.admin.UserStatusUpdateRequest;
import com.example.backend.DTO.user.UserResponse;
import com.example.backend.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class AdminUserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @InjectMocks
    private AdminUserController adminUserController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminUserController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    @Test
    void testGetAllUsers_WithFiltersAndPagination() throws Exception {
        UserResponse u = new UserResponse();
        u.setUserId("u1");
        u.setEmail("test@example.com");
        u.setFullName("Nguyen Van A");
        u.setActive(true);
        u.setProvider("LOCAL");

        when(userService.getAllUsers(eq(true), eq("LOCAL"), eq("Nguyen"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(u), org.springframework.data.domain.PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/admin/users")
                        .param("active", "true")
                        .param("provider", "LOCAL")
                        .param("keyword", "Nguyen")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].userId").value("u1"))
                .andExpect(jsonPath("$.content[0].email").value("test@example.com"))
                .andExpect(jsonPath("$.content[0].active").value(true));
    }

    @Test
    void testUpdateUserStatus_LockUser() throws Exception {
        UserStatusUpdateRequest req = new UserStatusUpdateRequest(false);
        UserResponse response = new UserResponse();
        response.setUserId("u1");
        response.setActive(false);

        when(userService.updateUserStatus("u1", false)).thenReturn(response);

        mockMvc.perform(patch("/admin/users/u1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value("u1"))
                .andExpect(jsonPath("$.active").value(false));
    }
}
