package com.olympiadplatform.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/** {@code correctAnswer} is only filled for the olympiad's managers, never for participants. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record QuestionResponse(
        String id,
        String text,
        String type,
        String options,
        String correctAnswer,
        Integer points
) {
}
