package com.olympiadplatform.dto.response;

public class QuestionResponse {
    
    private String id;
    private String text;
    private String type;
    private String options;
    private Integer points;
    
    // Constructors
    public QuestionResponse() {}
    
    public QuestionResponse(String id, String text, String type, String options, Integer points) {
        this.id = id;
        this.text = text;
        this.type = type;
        this.options = options;
        this.points = points;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
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
    
    public Integer getPoints() {
        return points;
    }
    
    public void setPoints(Integer points) {
        this.points = points;
    }
}