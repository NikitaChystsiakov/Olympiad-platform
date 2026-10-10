package com.olympiadplatform.service;

import com.olympiadplatform.dto.request.AdminUserRequest;
import com.olympiadplatform.dto.response.UserResponse;
import com.olympiadplatform.entity.User;
import com.olympiadplatform.exception.BusinessException;
import com.olympiadplatform.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AdminUserService service;

    @BeforeEach
    void setUp() {
        service = new AdminUserService(userRepository, passwordEncoder);
    }

    @Test
    void createEncodesPasswordAndReturnsUserResponse() {
        AdminUserRequest request = request("new@test.com", "secret123", "New User", User.Role.ORGANIZER, true);
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId("user-1");
            return user;
        });

        UserResponse result = service.create(request);

        assertThat(result.getId()).isEqualTo("user-1");
        assertThat(result.getEmail()).isEqualTo("new@test.com");
        assertThat(result.getRole()).isEqualTo(User.Role.ORGANIZER);
        assertThat(result.isActive()).isTrue();
    }

    @Test
    void createRejectsDuplicateEmail() {
        AdminUserRequest request = request("new@test.com", "secret123", "New User", User.Role.STUDENT, true);
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(BusinessException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void updateChangesOnlyProvidedFields() {
        User user = user("user-1", "old@test.com", User.Role.STUDENT);
        AdminUserRequest request = new AdminUserRequest();
        request.setFullName("Updated Name");
        request.setRole(User.Role.ADMIN);
        request.setActive(false);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        UserResponse result = service.update(user.getId(), request, "admin@test.com");

        assertThat(result.getFullName()).isEqualTo("Updated Name");
        assertThat(result.getRole()).isEqualTo(User.Role.ADMIN);
        assertThat(result.isActive()).isFalse();
        assertThat(user.getEmail()).isEqualTo("old@test.com");
    }

    @Test
    void deleteRejectsCurrentAdminAccount() {
        User admin = user("admin-1", "admin@test.com", User.Role.ADMIN);
        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> service.delete(admin.getId(), "admin@test.com"))
                .isInstanceOf(BusinessException.class);

        verify(userRepository, never()).delete(any());
    }

    private AdminUserRequest request(String email, String password, String fullName, User.Role role, boolean active) {
        AdminUserRequest request = new AdminUserRequest();
        request.setEmail(email);
        request.setPassword(password);
        request.setFullName(fullName);
        request.setRole(role);
        request.setActive(active);
        return request;
    }

    private User user(String id, String email, User.Role role) {
        return User.builder()
                .id(id)
                .email(email)
                .passwordHash("encoded")
                .fullName(email)
                .role(role)
                .isActive(true)
                .build();
    }
}
