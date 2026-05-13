package com.olympiadplatform.security;

import com.olympiadplatform.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.List;

@Getter
@AllArgsConstructor
public class UserPrincipal implements UserDetails {
    private String id;
    private String email;
    private String password;
    private String fullName;
    private String role;
    private boolean active;
    
    public static UserPrincipal create(User user) {
        return new UserPrincipal(
            user.getId(),
            user.getEmail(),
            user.getPasswordHash(),
            user.getFullName(),
            user.getRole().name(),
            user.isActive()
        );
    }
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }
    
    @Override
    public String getPassword() {
        return password;
    }
    
    @Override
    public String getUsername() {
        return email;
    }
    
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }
    
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }
    
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
    
    @Override
    public boolean isEnabled() {
        return active;
    }
}