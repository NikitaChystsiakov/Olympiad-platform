package com.olympiadplatform.controller;

import com.olympiadplatform.dto.request.GoogleLoginRequest;
import com.olympiadplatform.dto.request.LoginRequest;
import com.olympiadplatform.dto.request.RegisterRequest;
import com.olympiadplatform.dto.response.ApiResponse;
import com.olympiadplatform.dto.response.AuthResponse;
import com.olympiadplatform.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(authService.loginWithGoogle(request.getIdToken()));
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestParam String refreshToken) {
        return ResponseEntity.ok(authService.refreshToken(refreshToken));
    }
}
