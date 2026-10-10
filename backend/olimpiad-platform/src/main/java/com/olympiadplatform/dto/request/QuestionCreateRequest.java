package com.olympiadplatform.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionCreateRequest {

    @NotBlank(message = "Введите текст вопроса")
    @Size(max = 5000, message = "Текст вопроса слишком длинный")
    private String text;

    @NotBlank(message = "Выберите тип вопроса")
    @Pattern(regexp = "(?i)SINGLE_CHOICE|MULTIPLE_CHOICE|TEXT|CODE|MANUAL_REVIEW", message = "Неизвестный тип вопроса")
    private String type;

    private String options;

    private String correctAnswer;

    @NotNull(message = "Укажите количество баллов")
    @Min(value = 1, message = "Минимум 1 балл")
    @Max(value = 1000, message = "Максимум 1000 баллов")
    private Integer points = 1;
}
