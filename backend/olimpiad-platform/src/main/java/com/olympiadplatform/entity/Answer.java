package com.olympiadplatform.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "answers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Answer {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participation_id", nullable = false)
    @JsonIgnore
    private Participation participation;
    
    @Column(nullable = false)
    private String questionId;
    
    @Column(columnDefinition = "TEXT")
    private String answer;
    
    private Boolean isCorrect;
    
    private Integer pointsEarned;

    @Column(columnDefinition = "TEXT")
    private String reviewComment;
    
    @Column(nullable = false)
    private LocalDateTime submittedAt;
}
