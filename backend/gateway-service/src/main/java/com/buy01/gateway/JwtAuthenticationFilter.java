package com.buy01.gateway;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.List;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {
    private final SecretKey secretKey;
    private final List<String> publicExact = List.of("/api/auth/register", "/api/auth/login");

    public JwtAuthenticationFilter(@Value("${app.jwt-secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        HttpMethod method = exchange.getRequest().getMethod();

        String header = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (isPublic(method, path) && (header == null || !header.startsWith("Bearer "))) {
            return chain.filter(exchange);
        }

        if (header == null || !header.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        try {
            Claims claims = Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(header.substring(7)).getPayload();
            String role = claims.get("role", String.class);
            ServerWebExchange mutated = exchange.mutate().request(builder -> builder
                .header("X-User-Id", claims.getSubject())
                .header("X-User-Email", claims.get("email", String.class))
                .header("X-User-Role", role)
            ).build();
            return chain.filter(mutated);
        } catch (Exception ex) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }

    private boolean isPublic(HttpMethod method, String path) {
        if (HttpMethod.OPTIONS.equals(method) || publicExact.contains(path) || path.startsWith("/actuator")) {
            return true;
        }
        if (HttpMethod.GET.equals(method) && (path.equals("/api/products") || path.startsWith("/api/products/") || path.startsWith("/api/media/images/") || path.startsWith("/api/users/avatars/"))) {
            return true;
        }
        return false;
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
