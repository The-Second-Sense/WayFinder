package com.example.backend_wayfinder.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    // One bucket per IP address
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    /**
     * Creates a bucket for a given IP.
     *
     * General endpoints  → 60 requests / minute
     * Auth endpoints     → 10 requests / minute  (brute-force protection)
     * Transaction endpoints → 20 requests / minute
     */
    private Bucket createBucketFor(String ip, String uri) {
        Bandwidth limit;

        if (uri.startsWith("/api/auth")) {
            // Strict — prevents brute-force on login/register
            limit = Bandwidth.builder()
                    .capacity(10)
                    .refillGreedy(10, Duration.ofMinutes(1))
                    .build();
        } else if (uri.startsWith("/api/transactions")) {
            // Medium — prevents spamming transfers
            limit = Bandwidth.builder()
                    .capacity(20)
                    .refillGreedy(20, Duration.ofMinutes(1))
                    .build();
        } else {
            // Default — general API calls
            limit = Bandwidth.builder()
                    .capacity(60)
                    .refillGreedy(60, Duration.ofMinutes(1))
                    .build();
        }

        return Bucket.builder().addLimit(limit).build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String ip = getClientIp(request);
        String uri = request.getRequestURI();

        // Use ip + endpoint-group as key so limits are per-IP per-group
        String bucketKey = ip + ":" + getBucketGroup(uri);
        Bucket bucket = buckets.computeIfAbsent(bucketKey, k -> createBucketFor(ip, uri));

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded for IP: {} on {}", ip, uri);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"error\": \"Too many requests. Please slow down and try again in a moment.\"}"
            );
        }
    }

    private String getBucketGroup(String uri) {
        if (uri.startsWith("/api/auth")) return "auth";
        if (uri.startsWith("/api/transactions")) return "transactions";
        return "general";
    }

    private String getClientIp(HttpServletRequest request) {
        // Respect X-Forwarded-For if behind a proxy/load balancer
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isEmpty()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

