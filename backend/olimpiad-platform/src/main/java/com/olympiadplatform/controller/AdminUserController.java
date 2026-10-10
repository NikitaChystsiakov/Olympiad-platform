package com.olympiadplatform.controller;

import com.olympiadplatform.dto.request.AdminUserRequest;
import com.olympiadplatform.dto.response.UserResponse;
import com.olympiadplatform.entity.User;
import com.olympiadplatform.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<Page<UserResponse>> getUsers(
            @RequestParam(required = false) User.Role role,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return ResponseEntity.ok(adminUserService.getUsers(role, search, pageable));
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody AdminUserRequest request) {
        return ResponseEntity.ok(adminUserService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable String id,
            @Valid @RequestBody AdminUserRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(adminUserService.update(id, request, email));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        adminUserService.delete(id, email);
        return ResponseEntity.noContent().build();
    }
}
