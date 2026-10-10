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
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/olympiads/{olympiadId}/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @GetMapping
    public List<QuestionResponse> getQuestions(@PathVariable UUID olympiadId, Authentication auth) {
        List<Question> questions = questionService.getQuestionsByOlympiadId(olympiadId, auth.getName());
        boolean includeAnswers = !questions.isEmpty()
                && questionService.canManage(questions.get(0).getOlympiad(), auth.getName());
        return questions.stream()
                .map(question -> toResponse(question, includeAnswers))
                .toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public QuestionResponse addQuestion(
            @PathVariable UUID olympiadId,
            @Valid @RequestBody QuestionCreateRequest request,
            Authentication auth) {
        return toResponse(questionService.addQuestion(olympiadId, request, auth.getName()), true);
    }

    @PutMapping("/{questionId}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public QuestionResponse updateQuestion(
            @PathVariable UUID olympiadId,
            @PathVariable String questionId,
            @Valid @RequestBody QuestionCreateRequest request,
            Authentication auth) {
        return toResponse(questionService.updateQuestion(olympiadId, questionId, request, auth.getName()), true);
    }

    @DeleteMapping("/{questionId}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<Void> deleteQuestion(
            @PathVariable UUID olympiadId,
            @PathVariable String questionId,
            Authentication auth) {
        questionService.deleteQuestion(olympiadId, questionId, auth.getName());
        return ResponseEntity.noContent().build();
    }

    private QuestionResponse toResponse(Question question, boolean includeAnswer) {
        return new QuestionResponse(
                question.getId(),
                question.getText(),
                question.getType().name(),
                question.getOptions(),
                includeAnswer ? question.getCorrectAnswer() : null,
                question.getPoints()
        );
    }
}
