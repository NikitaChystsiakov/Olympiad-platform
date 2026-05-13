package com.olympiadplatform.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RunCodeRequest {
    @NotBlank
    private String sourceCode;

    @NotNull
    private Integer languageId;

    private String stdin;
}
