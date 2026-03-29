package com.expense.reimbursement.config;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int LIMIT_PER_MINUTE = 120;
    private static final long WINDOW_SECONDS = 60;

    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/") || path.startsWith("/api/auth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String key = request.getRemoteAddr();
        long now = Instant.now().getEpochSecond();

        WindowCounter counter = counters.computeIfAbsent(key, k -> new WindowCounter(now));

        synchronized (counter) {
            if (now - counter.windowStart >= WINDOW_SECONDS) {
                counter.windowStart = now;
                counter.count.set(0);
            }

            int current = counter.count.incrementAndGet();
            if (current > LIMIT_PER_MINUTE) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"message\":\"Too many requests\",\"data\":null}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private static class WindowCounter {

        private long windowStart;
        private final AtomicInteger count = new AtomicInteger(0);

        private WindowCounter(long windowStart) {
            this.windowStart = windowStart;
        }
    }
}
