package com.todo.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {
    private final SecretKey key = Keys.hmacShaKeyFor("todo-app-secret-key-change-in-prod-must-be-long-enough-32b".getBytes(StandardCharsets.UTF_8));
    private final long EXPIRATION = 24 * 60 * 60 * 1000;

    public String generate(Long userId, String username) {
        return Jwts.builder()
            .subject(userId.toString())
            .claim("username", username)
            .expiration(new Date(System.currentTimeMillis() + EXPIRATION))
            .signWith(key)
            .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
