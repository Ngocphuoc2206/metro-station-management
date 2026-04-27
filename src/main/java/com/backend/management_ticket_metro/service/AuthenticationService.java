package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.dto.request.AuthenticationRequest;
import com.backend.management_ticket_metro.dto.request.IntrospectRequest;
import com.backend.management_ticket_metro.dto.request.LogoutRequest;
import com.backend.management_ticket_metro.dto.request.RefreshRequest;
import com.backend.management_ticket_metro.dto.response.AuthenticationResponse;
import com.backend.management_ticket_metro.dto.response.IntrospectResponse;
import com.backend.management_ticket_metro.entity.InvalidatedToken;
import com.backend.management_ticket_metro.entity.Role;
import com.backend.management_ticket_metro.entity.User;
import com.backend.management_ticket_metro.enums.UserStatus;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.repository.InvalidatedTokenRepository;
import com.backend.management_ticket_metro.repository.UserRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.StringJoiner;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {
    @NonFinal
    @Value("${jwt.signer-key}")
    private String SIGNER_KEY;

    @NonFinal
    @Value("${jwt.valid-duration}")
    private Long VALID_DURATION;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    private Long REFRESHABLE_DURATION;

    private final UserRepository userRepository;
    private final InvalidatedTokenRepository invalidatedTokenRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthenticationResponse authenticate(AuthenticationRequest request){
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.EMAIL_NOT_EXISTED));

        if (user.getStatus() != UserStatus.ACTIVE)
            throw new AppException(ErrorCode.UNAUTHORIZED);

        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());

        if (!authenticated) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        String token = generateToken(user);

        return AuthenticationResponse.builder()
                .token(token)
                .authenticated(true)
                .build();
    }

    public void logout(LogoutRequest request) throws ParseException, JOSEException{
        try{
            var signToken = verifyToken(request.getToken(), true);

            String jit = signToken.getJWTClaimsSet().getJWTID();
            Date expiryTime = signToken.getJWTClaimsSet().getExpirationTime();

            InvalidatedToken invalidatedToken = InvalidatedToken.builder().id(jit).expiryTime(expiryTime).build();

            invalidatedTokenRepository.save(invalidatedToken);
        } catch (AppException e) {
            log.warn("Token has already expired");
        }
    }

    public AuthenticationResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException{
        var signedJWT = verifyToken(request.getToken(), true);

        var jit = signedJWT.getJWTClaimsSet().getJWTID();
        var expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();

        InvalidatedToken invalidatedToken = InvalidatedToken.builder().id(jit).expiryTime(expiryTime).build();
        invalidatedTokenRepository.save(invalidatedToken);

        var userName = signedJWT.getJWTClaimsSet().getSubject();
        var user =
                userRepository.findByEmail(userName).orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        var token = generateToken(user);
        return AuthenticationResponse.builder().authenticated(true).token(token).build();
    }

    private String generateToken(User user){
        //Create header
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        //claim set
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(user.getEmail())
                .issuer("management-ticket-metro")
                .issueTime(new Date())
                .expirationTime(new Date(
                        Instant.now().plus(VALID_DURATION, ChronoUnit.SECONDS).toEpochMilli()
                ))
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", buildScope(user))
                .build();

        //payload
        Payload payload = new Payload(claimsSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(header, payload);

        try{
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }
    }

    private String buildScope(User user){
        StringJoiner stringJoiner = new StringJoiner(" ");

        if (user.getRoles() != null && !user.getRoles().isEmpty()){
            user.getRoles().forEach(role -> { stringJoiner.add("ROLE_" + role.getRoleName());
            if(role.getPermissions() != null && !role.getPermissions().isEmpty()){
                role.getPermissions().forEach(p -> stringJoiner.add(p.getName()));
            }
            });
        }
        return stringJoiner.toString();
    }

    public IntrospectResponse introspect(IntrospectRequest request){
        var token = request.getToken();
        boolean isValid = true;

        try{
            verifyToken(token, false);
        } catch (AppException e){
            isValid = false;
        } catch (ParseException | JOSEException e) {
            throw new RuntimeException(e);
        }

        return IntrospectResponse.builder().valid(isValid).build();
    }

    private SignedJWT verifyToken(String token, boolean isRefresh) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());

        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expiryTime = (isRefresh)
                ? new Date(signedJWT.getJWTClaimsSet().getIssueTime().toInstant()
                .plus(REFRESHABLE_DURATION, ChronoUnit.SECONDS).toEpochMilli())
                : signedJWT.getJWTClaimsSet().getExpirationTime();

        var verified = signedJWT.verify(verifier);

        if (!(verified && expiryTime.after(new Date()))) throw new AppException(ErrorCode.UNAUTHENTICATED);

        //Check invalid token
        if (invalidatedTokenRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID()))
            throw new AppException(ErrorCode.UNAUTHENTICATED);

        return signedJWT;
    }

}
