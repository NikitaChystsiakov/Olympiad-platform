package com.olympiadplatform.service;

import com.olympiadplatform.dto.request.AdminUserRequest;
import com.olympiadplatform.dto.response.UserResponse;
import com.olympiadplatform.entity.User;
import com.olympiadplatform.exception.BusinessException;
import com.olympiadplatform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.lang.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public Page<UserResponse> getUsers(User.Role role, String search, Pageable pageable) {
        return userRepository.findByRoleAndSearch(role, search, pageable)
                .map(this::toResponse);
    }

    @NonNull
    @Transactional
    public UserResponse create(@NonNull AdminUserRequest request) {
        if (isBlank(request.getEmail())) {
            throw new BusinessException("Укажите email");
        }
        if (isBlank(request.getPassword())) {
            throw new BusinessException("Укажите пароль");
        }
        if (isBlank(request.getFullName())) {
            throw new BusinessException("Укажите ФИО");
        }
        if (request.getRole() == null) {
            throw new BusinessException("Укажите роль");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Пользователь с таким email уже существует");
        }

        User user = User.builder()
                .email(request.getEmail().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .role(request.getRole())
                .isActive(request.getActive() == null || request.getActive())
                .build();

        return toResponse(userRepository.save(user));
    }

    @NonNull
    @Transactional
    public UserResponse update(@NonNull String id, @NonNull AdminUserRequest request, @NonNull String currentAdminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("Пользователь не найден"));

        boolean isSelf = user.getEmail().equalsIgnoreCase(currentAdminEmail);
        if (isSelf && request.getRole() != null && request.getRole() != User.Role.ADMIN) {
            throw new BusinessException("Нельзя снять роль администратора с самого себя");
        }
        if (isSelf && Boolean.FALSE.equals(request.getActive())) {
            throw new BusinessException("Нельзя заблокировать собственный аккаунт");
        }

        if (!isBlank(request.getEmail())) {
            String email = request.getEmail().trim();
            userRepository.findByEmail(email)
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new BusinessException("Пользователь с таким email уже существует");
                    });
            user.setEmail(email);
        }
        if (!isBlank(request.getFullName())) {
            user.setFullName(request.getFullName().trim());
        }
        if (!isBlank(request.getPassword())) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void delete(@NonNull String id, @NonNull String currentAdminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("Пользователь не найден"));
        if (user.getEmail().equalsIgnoreCase(currentAdminEmail)) {
            throw new BusinessException("Нельзя удалить собственный аккаунт");
        }
        userRepository.delete(user);
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
