package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.entity.Role;
import com.backend.management_ticket_metro.entity.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.stream.Collectors;

@Service
public class AuthenticationService {

    @NonFinal
    @Value("${jwt.signer-key}")
    private String SIGNER_KEY;

    @NonFinal
    @Value("${jwt.access-token-expiration-seconds}")
    private Long EXPIRES_TIME;

    private SecretKey getSigningKey(){
        return Keys.hmacShaKeyFor(SIGNER_KEY.getBytes());
    }

    public String generateAccessToken(User user){
        //plus time expires
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(EXPIRES_TIME);

        return Jwts.builder()
                .subject(user.getUserId())
                .claim("email", user.getEmail())
                .claim("roles", user.getRoles().stream().map(Role::getRoleName).collect(Collectors.toList()))
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(getSigningKey())
                .compact();
    }


    public Long getAccessTokenExpirationSeconds(){
        return EXPIRES_TIME;
    }
    //Get userID
    public String extractUserId(String token){
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean isValidToken(String token){
        try{
            Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);
            return true;
        }catch (Exception e){
            return false;
        }
    }
}
