package com.olympiadplatform.dto.response;

import com.olympiadplatform.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {
    private String id;
    private String email;
    private String fullName;
    private User.Role role;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
