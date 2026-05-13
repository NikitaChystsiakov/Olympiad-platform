package com.olympiadplatform.dto.request;

import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class ReviewAnswerRequest {
    @Min(0)
    private Integer pointsEarned;
    private String reviewComment;
}
