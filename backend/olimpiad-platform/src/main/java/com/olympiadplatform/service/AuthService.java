package com.olympiadplatform.service;

import com.olympiadplatform.dto.request.LoginRequest;
import com.olympiadplatform.dto.request.RegisterRequest;
import com.olympiadplatform.dto.response.AuthResponse;
import com.olympiadplatform.entity.RefreshToken;
import com.olympiadplatform.entity.User;
import com.olympiadplatform.exception.BusinessException;
import com.olympiadplatform.repository.RefreshTokenRepository;
import com.olympiadplatform.repository.UserRepository;
import com.olympiadplatform.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final GoogleTokenVerifier googleTokenVerifier;
    
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Пользователь с таким email уже существует");
        }
        
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(User.Role.STUDENT)
                .isActive(true)
                .build();
        
        user = userRepository.save(user);
        
        String accessToken = tokenProvider.generateAccessToken(createAuthentication(user));
        String refreshToken = createRefreshToken(user);
        
        return buildAuthResponse(user, accessToken, refreshToken);
    }
    
    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> BusinessException.notFound("Пользователь не найден"));
        
        String accessToken = tokenProvider.generateAccessToken(authentication);
        String refreshToken = createRefreshToken(user);
        
        return buildAuthResponse(user, accessToken, refreshToken);
    }
    
    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        RefreshToken token = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new BusinessException("Недействительный refresh-токен", org.springframework.http.HttpStatus.UNAUTHORIZED));
        
        if (token.isRevoked() || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Сессия истекла, войдите заново", org.springframework.http.HttpStatus.UNAUTHORIZED);
        }
        
        User user = token.getUser();
        if (!user.isActive()) {
            throw BusinessException.forbidden("Аккаунт заблокирован");
        }
        String newAccessToken = tokenProvider.generateAccessToken(createAuthentication(user));
        String newRefreshToken = createRefreshToken(user);
        
        token.setRevoked(true);
        refreshTokenRepository.save(token);
        
        return buildAuthResponse(user, newAccessToken, newRefreshToken);
    }

    @Transactional
    public AuthResponse loginWithGoogle(String idToken) {
        GoogleTokenVerifier.GoogleProfile profile = googleTokenVerifier.verify(idToken);
        User user = userRepository.findByEmail(profile.email())
                .map(existing -> updateGoogleProfile(existing, profile))
                .orElseGet(() -> User.builder()
                        .email(profile.email())
                        .fullName(profile.name())
                        .role(User.Role.STUDENT)
                        .isActive(true)
                        .oauthProvider("GOOGLE")
                        .oauthId(profile.id())
                        .build());

        user = userRepository.save(user);
        if (!user.isActive()) {
            throw BusinessException.forbidden("Аккаунт заблокирован");
        }

        Authentication authentication = createAuthentication(user);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String accessToken = tokenProvider.generateAccessToken(authentication);
        String refreshToken = createRefreshToken(user);
        return buildAuthResponse(user, accessToken, refreshToken);
    }

    private User updateGoogleProfile(User user, GoogleTokenVerifier.GoogleProfile profile) {
        user.setOauthProvider("GOOGLE");
        user.setOauthId(profile.id());
        if (user.getFullName() == null || user.getFullName().isBlank() || user.getFullName().equals(user.getEmail())) {
            user.setFullName(profile.name());
        }
        return user;
    }
    
    private String createRefreshToken(User user) {
        String tokenValue = tokenProvider.generateRefreshToken(user.getId());
        
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(tokenValue)
                .expiresAt(LocalDateTime.now().plusDays(1))
                .revoked(false)
                .build();
        
        refreshTokenRepository.save(refreshToken);
        return tokenValue;
    }
    
    private Authentication createAuthentication(User user) {
        return new UsernamePasswordAuthenticationToken(
                com.olympiadplatform.security.UserPrincipal.create(user),
                null,
                java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }
    
    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }
}
