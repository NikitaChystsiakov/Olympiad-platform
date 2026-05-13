package com.olympiadplatform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "participations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Participation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"passwordHash", "refreshTokens", "hibernateLazyInitializer", "handler"})
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "olympiad_id", nullable = false)
    @JsonIgnoreProperties({"questions", "participations"})
    private Olympiad olympiad;
    
    @Column(nullable = false)
    private LocalDateTime startedAt;
    
    private LocalDateTime finishedAt;
    
    private Integer score;
    
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ParticipationStatus status = ParticipationStatus.ACTIVE;
    
    public enum ParticipationStatus {
        ACTIVE, PAUSED, PENDING_REVIEW, FINISHED, DISQUALIFIED
    }
}
