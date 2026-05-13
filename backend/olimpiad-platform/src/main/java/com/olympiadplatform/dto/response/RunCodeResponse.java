package com.olympiadplatform.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RunCodeResponse {
    private String stdout;
    private String stderr;
    private String compileOutput;
    private String message;
    private String status;
    private Integer statusId;
    private String time;
    private Integer memory;
}
