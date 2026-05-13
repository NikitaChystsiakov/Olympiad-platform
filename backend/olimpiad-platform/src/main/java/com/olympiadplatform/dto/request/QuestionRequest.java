package com.olympiadplatform.dto.request;

import com.olympiadplatform.entity.Question;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionRequest {
    
    @NotBlank(message = "Текст вопроса обязателен")
    private String text;
    
    @NotNull(message = "Тип вопроса обязателен")
    private Question.QuestionType type;
    
    private List<String> options;
    
    @NotBlank(message = "Правильный ответ обязателен")
    private String correctAnswer;
    
    @Min(value = 1, message = "Минимальное количество баллов - 1")
    @Max(value = 100, message = "Максимальное количество баллов - 100")
    private Integer points;
}