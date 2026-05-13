package com.olympiadplatform.dto.request;

import jakarta.validation.constraints.NotBlank;

public class QuestionCreateRequest {
    
    @NotBlank(message = "Question text is required")
    private String text;
    
    @NotBlank(message = "Question type is required")
    private String type;
    
    private String options;
    
    private String correctAnswer;
    
    private Integer points = 1;
    
    // Constructors
    public QuestionCreateRequest() {}
    
    public QuestionCreateRequest(String text, String type, String options, String correctAnswer, Integer points) {
        this.text = text;
        this.type = type;
        this.options = options;
        this.correctAnswer = correctAnswer;
        this.points = points;
    }
    
    // Getters and Setters
    public String getText() {
        return text;
    }
    
    public void setText(String text) {
        this.text = text;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getOptions() {
        return options;
    }
    
    public void setOptions(String options) {
        this.options = options;
    }
    
    public String getCorrectAnswer() {
        return correctAnswer;
    }
    
    public void setCorrectAnswer(String correctAnswer) {
        this.correctAnswer = correctAnswer;
    }
    
    public Integer getPoints() {
        return points;
    }
    
    public void setPoints(Integer points) {
        this.points = points;
    }
}