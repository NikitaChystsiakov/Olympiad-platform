package com.olympiadplatform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "proctoring_events", indexes = {
    @Index(name = "idx_proctoring_user_time", columnList = "user_id, timestamp")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProctoringEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    /** Email of the participant (the JWT subject used across the API). */
    @Column(nullable = false)
    private String userId;
    
    @Column(nullable = false)
    private String olympiadId;
    
    private String sessionId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType eventType;
    
    @Column(columnDefinition = "TEXT")
    private String metadata;
    
    @Column(nullable = false)
    private LocalDateTime timestamp;
    
    @Builder.Default
    private boolean isFlagged = false;
    
    public enum EventType {
        TAB_SWITCH, FULLSCREEN_EXIT, FACE_MISSING, MULTIPLE_FACES, COPY_PASTE, CAMERA_UNAVAILABLE, SUSPICIOUS_SOUND, SCREEN_RECORDING
    }
}