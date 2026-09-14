package com.example.backend.sercurity;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

public class TraceIdFilterTest {

    private TraceIdFilter traceIdFilter;

    @BeforeEach
    void setUp() {
        traceIdFilter = new TraceIdFilter();
        MDC.clear();
    }

    @Test
    void testDoFilter_GeneratesNewTraceIdWhenNoneProvided() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        AtomicReference<String> mdcTraceIdDuringExecution = new AtomicReference<>();

        FilterChain filterChain = (req, res) -> {
            mdcTraceIdDuringExecution.set(MDC.get(TraceIdFilter.TRACE_ID_KEY));
        };

        traceIdFilter.doFilter(request, response, filterChain);

        // 1. Trace ID phải được sinh ra và đưa vào MDC trong lúc request đang xử lý
        assertNotNull(mdcTraceIdDuringExecution.get());
        assertFalse(mdcTraceIdDuringExecution.get().isBlank());

        // 2. Header X-Trace-Id phải được trả về cho response
        String responseHeader = response.getHeader(TraceIdFilter.TRACE_HEADER);
        assertEquals(mdcTraceIdDuringExecution.get(), responseHeader);

        // 3. Sau khi kết thúc request, MDC phải được dọn dẹp sạch sẽ (tránh memory leak)
        assertNull(MDC.get(TraceIdFilter.TRACE_ID_KEY));
    }

    @Test
    void testDoFilter_ReusesExistingTraceIdFromHeader() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(TraceIdFilter.TRACE_HEADER, "custom-trace-id-12345");
        MockHttpServletResponse response = new MockHttpServletResponse();

        AtomicReference<String> mdcTraceIdDuringExecution = new AtomicReference<>();

        FilterChain filterChain = (req, res) -> {
            mdcTraceIdDuringExecution.set(MDC.get(TraceIdFilter.TRACE_ID_KEY));
        };

        traceIdFilter.doFilter(request, response, filterChain);

        assertEquals("custom-trace-id-12345", mdcTraceIdDuringExecution.get());
        assertEquals("custom-trace-id-12345", response.getHeader(TraceIdFilter.TRACE_HEADER));
        assertNull(MDC.get(TraceIdFilter.TRACE_ID_KEY));
    }

    @Test
    void testDoFilter_ClearsMdcEvenWhenExceptionThrown() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        FilterChain failingChain = (req, res) -> {
            assertNotNull(MDC.get(TraceIdFilter.TRACE_ID_KEY));
            throw new RuntimeException("Simulated error in controller");
        };

        assertThrows(RuntimeException.class, () -> traceIdFilter.doFilter(request, response, failingChain));

        // MDC vẫn phải được xóa dù có exception
        assertNull(MDC.get(TraceIdFilter.TRACE_ID_KEY));
    }
}
