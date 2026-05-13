package com.olympiadplatform.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AnswerResultResponse {
    private String questionId;
    private String questionText;
    private String questionType;
    private String options;
    private String userAnswer;
    private String correctAnswer;
    private Boolean isCorrect;
    private Integer pointsEarned;
    private Integer maxPoints;
    private Boolean pendingReview;
    private String reviewComment;
}
