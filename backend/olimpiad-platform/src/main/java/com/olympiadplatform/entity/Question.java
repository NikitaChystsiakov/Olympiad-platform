package com.olympiadplatform.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.*;
@Entity
@Table(name = "questions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"olympiad"})
@ToString(exclude = {"olympiad"})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionType type;

    @Column(columnDefinition = "TEXT")
    private String options;

    @Column(columnDefinition = "TEXT")
    private String correctAnswer;

    @Column(nullable = false)
    private Integer points;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "olympiad_id", nullable = false)
    @JsonIgnoreProperties(value = {"questions", "participations", "hibernateLazyInitializer", "handler"}, allowSetters = true)
    private Olympiad olympiad;

    public enum QuestionType {
        SINGLE_CHOICE, MULTIPLE_CHOICE, TEXT, CODE, MANUAL_REVIEW
    }
}
