package com.olympiadplatform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    private String passwordHash;
    
    @Column(nullable = false)
    private String fullName;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.STUDENT;
    
    @Builder.Default
    private boolean isActive = true;
    
    private String oauthProvider;
    
    private String oauthId;
    
    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    @Version
    private Long version;
    
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<RefreshToken> refreshTokens = new ArrayList<>();
    
    public enum Role {
        STUDENT, ORGANIZER, ADMIN
    }
}