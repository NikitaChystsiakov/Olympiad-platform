package com.olympiadplatform.controller;

import com.olympiadplatform.dto.request.ReviewAnswerRequest;
import com.olympiadplatform.dto.request.SubmitAnswerRequest;
import com.olympiadplatform.dto.response.ApiResponse;
import com.olympiadplatform.dto.response.ManualReviewResponse;
import com.olympiadplatform.dto.response.OlympiadParticipantResponse;
import com.olympiadplatform.dto.response.ParticipationResponse;
import com.olympiadplatform.dto.response.ParticipationSummaryResponse;
import com.olympiadplatform.dto.response.SavedAnswerResponse;
import com.olympiadplatform.service.ParticipationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/participations")
@RequiredArgsConstructor
public class ParticipationController {

    private final ParticipationService participationService;

    @PostMapping("/start/{olympiadId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ParticipationSummaryResponse startOlympiad(@PathVariable UUID olympiadId, Authentication auth) {
        return ParticipationSummaryResponse.from(participationService.startParticipation(olympiadId, auth.getName()));
    }

    @PostMapping("/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse submitAnswer(@Valid @RequestBody SubmitAnswerRequest request, Authentication auth) {
        participationService.submitAnswer(
                request.getParticipationId(),
                request.getQuestionId(),
                request.getAnswer(),
                auth.getName()
        );
        return new ApiResponse(true, "Ответ сохранён");
    }

    @PostMapping("/finish/{participationId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ParticipationSummaryResponse finishOlympiad(@PathVariable String participationId, Authentication auth) {
        return ParticipationSummaryResponse.from(participationService.finishParticipation(participationId, auth.getName()));
    }

    @GetMapping("/my")
    public List<ParticipationSummaryResponse> getMyParticipations(Authentication auth) {
        return participationService.getMyParticipations(auth.getName());
    }

    @GetMapping("/{participationId}/answers")
    public List<SavedAnswerResponse> getSavedAnswers(@PathVariable String participationId, Authentication auth) {
        return participationService.getSavedAnswers(participationId, auth.getName());
    }

    @GetMapping("/{participationId}/results")
    public ParticipationResponse getResults(@PathVariable String participationId, Authentication auth) {
        return participationService.getResults(participationId, auth.getName());
    }

    @GetMapping("/olympiads/{olympiadId}/participants")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public List<OlympiadParticipantResponse> getOlympiadParticipants(@PathVariable UUID olympiadId, Authentication auth) {
        return participationService.getOlympiadParticipants(olympiadId, auth.getName());
    }

    @GetMapping("/olympiads/{olympiadId}/manual-review")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public List<ManualReviewResponse> getManualReviewQueue(@PathVariable UUID olympiadId, Authentication auth) {
        return participationService.getManualReviewQueue(olympiadId, auth.getName());
    }

    @PostMapping("/answers/{answerId}/review")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse> reviewAnswer(
            @PathVariable String answerId,
            @Valid @RequestBody ReviewAnswerRequest request,
            Authentication auth) {
        participationService.reviewAnswer(answerId, request, auth.getName());
        return ResponseEntity.ok(new ApiResponse(true, "Оценка сохранена"));
    }
}
