package com.olympiadplatform.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OlympiadCreateRequest {
    
    @NotBlank(message = "Название олимпиады обязательно")
    @Size(min = 5, max = 200, message = "Название должно быть от 5 до 200 символов")
    private String title;
    
    @NotBlank(message = "Описание обязательно")
    @Size(min = 10, max = 2000, message = "Описание должно быть от 10 до 2000 символов")
    private String description;
    
    @NotNull(message = "Дата начала обязательна")
    @FutureOrPresent(message = "Дата начала не может быть в прошлом")
    private LocalDateTime startTime;
    
    @NotNull(message = "Дата окончания обязательна")
    @Future(message = "Дата окончания должна быть в будущем")
    private LocalDateTime endTime;
    
    @Min(value = 5, message = "Минимальная длительность 5 минут")
    @Max(value = 480, message = "Максимальная длительность 8 часов")
    private Integer durationMinutes;
    
    @AssertTrue(message = "Дата окончания должна быть позже даты начала")
    public boolean isEndTimeAfterStartTime() {
        if (startTime == null || endTime == null) {
            return true;
        }
        return endTime.isAfter(startTime);
    }
}