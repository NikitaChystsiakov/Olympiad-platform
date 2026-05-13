package com.olympiadplatform.dto.request;

import com.olympiadplatform.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminUserRequest {
    @Email
    private String email;

    @Size(min = 6)
    private String password;

    private String fullName;

    private User.Role role;

    private Boolean active;
}
