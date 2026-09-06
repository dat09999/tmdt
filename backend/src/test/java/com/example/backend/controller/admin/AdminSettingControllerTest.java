package com.example.backend.controller.admin;

import com.example.backend.module.PlatformConfig;
import com.example.backend.module.User;
import com.example.backend.service.PlatformConfigService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class AdminSettingControllerTest {

    private MockMvc mockMvc;

    @Mock
    private PlatformConfigService platformConfigService;

    @InjectMocks
    private AdminSettingController adminSettingController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminSettingController).build();

        User admin = User.builder().id("admin1").role("ADMIN").email("admin@domix.com").build();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                admin, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetCommissionConfig() throws Exception {
        PlatformConfig config = PlatformConfig.builder()
                .id("DEFAULT")
                .commissionRate(5.0)
                .build();

        when(platformConfigService.getConfig()).thenReturn(config);

        mockMvc.perform(get("/admin/settings/commission"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.commissionRate").value(5.0));
    }

    @Test
    void testUpdateCommissionConfig() throws Exception {
        PlatformConfig updated = PlatformConfig.builder()
                .id("DEFAULT")
                .commissionRate(8.5)
                .build();

        when(platformConfigService.updateCommissionRate(eq(8.5), anyString())).thenReturn(updated);

        mockMvc.perform(put("/admin/settings/commission").param("rate", "8.5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.commissionRate").value(8.5));
    }
}
