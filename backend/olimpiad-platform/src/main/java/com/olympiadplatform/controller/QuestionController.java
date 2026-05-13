package com.olympiadplatform.controller;

import com.olympiadplatform.dto.request.QuestionCreateRequest;
import com.olympiadplatform.dto.response.QuestionResponse;
import com.olympiadplatform.entity.Question;
import com.olympiadplatform.service.QuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/olympiads/{olympiadId}/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @GetMapping
    public ResponseEntity<List<QuestionResponse>> getQuestions(
            @PathVariable UUID olympiadId) {
        return ResponseEntity.ok(questionService.getQuestionsByOlympiadId(olympiadId)
                .stream()
                .map(this::toResponse)
                .toList());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<QuestionResponse> addQuestion(
            @PathVariable UUID olympiadId,
            @Valid @RequestBody QuestionCreateRequest request) {
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        
        System.out.println("📥 ADD QUESTION - Olympiad: " + olympiadId);
        System.out.println("📥 User: " + email);
        System.out.println("📥 Text: " + request.getText());
        System.out.println("📥 Type: " + request.getType());
        System.out.println("📥 Options: " + request.getOptions());
        System.out.println("📥 Answer: " + request.getCorrectAnswer());
        System.out.println("📥 Points: " + request.getPoints());
        
        return ResponseEntity.ok(toResponse(questionService.addQuestion(olympiadId, request, email)));
    }

    @PutMapping("/{questionId}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<QuestionResponse> updateQuestion(
            @PathVariable UUID olympiadId,
            @PathVariable String questionId,
            @Valid @RequestBody QuestionCreateRequest request) {
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        
        return ResponseEntity.ok(toResponse(questionService.updateQuestion(olympiadId, questionId, request, email)));
    }

    @DeleteMapping("/{questionId}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<Void> deleteQuestion(
            @PathVariable UUID olympiadId,
            @PathVariable String questionId) {
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        
        questionService.deleteQuestion(olympiadId, questionId, email);
        return ResponseEntity.noContent().build();
    }

    private QuestionResponse toResponse(Question question) {
        return new QuestionResponse(
                question.getId(),
                question.getText(),
                question.getType().name(),
                question.getOptions(),
                question.getPoints()
        );
    }
}
