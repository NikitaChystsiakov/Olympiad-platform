package com.olympiadplatform.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ManualReviewResponse {
    private String participationId;
    private String answerId;
    private String questionId;
    private String questionText;
    private String userName;
    private String userEmail;
    private String userAnswer;
    private Integer pointsEarned;
    private Integer maxPoints;
    private String reviewComment;
}
