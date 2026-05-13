package com.olympiadplatform.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProctoringEventRequest {
    @NotBlank
    private String olympiadId;
    
    private String sessionId;
    
    @NotBlank
    private String eventType;
    
    private String metadata;
}