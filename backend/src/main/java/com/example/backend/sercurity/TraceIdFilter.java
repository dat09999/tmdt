package com.example.backend.sercurity;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Filter tự động cấp và gắn traceId (Correlation ID) cho mỗi HTTP request.
 * - Lưu vào MDC (Mapped Diagnostic Context) của SLF4J để mọi log in ra đều có traceId.
 * - Đính kèm header X-Trace-Id vào HTTP Response để frontend/client có thể tra cứu khi gặp lỗi.
 * - Dọn dẹp MDC trong khối finally để chống rò rỉ bộ nhớ (ThreadLocal leak).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TraceIdFilter extends OncePerRequestFilter {

    public static final String TRACE_ID_KEY = "traceId";
    public static final String TRACE_HEADER = "X-Trace-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String traceId = request.getHeader(TRACE_HEADER);
        if (!StringUtils.hasText(traceId)) {
            traceId = request.getHeader("X-Request-Id");
        }
        if (!StringUtils.hasText(traceId)) {
            traceId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        }

        MDC.put(TRACE_ID_KEY, traceId);
        response.setHeader(TRACE_HEADER, traceId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(TRACE_ID_KEY);
            MDC.clear();
        }
    }
}
