package com.olympiadplatform.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "olympiads")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"questions", "participations"})
@ToString(exclude = {"questions", "participations"})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Olympiad {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    @Column(nullable = false)
    private Integer durationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OlympiadStatus status;

    @Column(nullable = false)
    private String createdBy;

    @OneToMany(mappedBy = "olympiad", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties(value = {"olympiad", "correctAnswer", "hibernateLazyInitializer", "handler"}, allowSetters = true)
    @BatchSize(size = 20)
    @Builder.Default
    private List<Question> questions = new ArrayList<>();

    @OneToMany(mappedBy = "olympiad")
    @JsonIgnore
    @Builder.Default
    private List<Participation> participations = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum OlympiadStatus {
        DRAFT, PUBLISHED, ACTIVE, FINISHED, CANCELLED
    }
}
