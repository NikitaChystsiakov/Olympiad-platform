package com.olympiadplatform.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubmitAnswerRequest {
    @NotBlank
    private String participationId;
    
    @NotBlank
    private String questionId;
    
    private String answer;
}