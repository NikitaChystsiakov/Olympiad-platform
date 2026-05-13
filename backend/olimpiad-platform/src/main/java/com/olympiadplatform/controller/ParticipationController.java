package com.olympiadplatform.controller;

import com.olympiadplatform.dto.request.ReviewAnswerRequest;
import com.olympiadplatform.dto.request.SubmitAnswerRequest;
import com.olympiadplatform.dto.response.ApiResponse;
import jakarta.validation.Valid;
import com.olympiadplatform.service.ParticipationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/participations")
@RequiredArgsConstructor
public class ParticipationController {

    private final ParticipationService participationService;

    @PostMapping("/start/{olympiadId}")
    public ResponseEntity<?> startOlympiad(@PathVariable UUID olympiadId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        
        System.out.println("📥 START PARTICIPATION - Olympiad: " + olympiadId + ", User: " + email);
        
        return ResponseEntity.ok(participationService.startParticipation(olympiadId, email));
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitAnswer(@RequestBody SubmitAnswerRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        
        participationService.submitAnswer(
                request.getParticipationId(),
                request.getQuestionId(),
                request.getAnswer(),
                email
        );

        return ResponseEntity.ok(new ApiResponse(true, "Answer submitted"));
    }

    @PostMapping("/finish/{participationId}")
    public ResponseEntity<?> finishOlympiad(@PathVariable String participationId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        
        return ResponseEntity.ok(participationService.finishParticipation(participationId, email));
    }

    @GetMapping("/{participationId}/results")
    public ResponseEntity<?> getResults(@PathVariable String participationId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        
        return ResponseEntity.ok(participationService.getResults(participationId, email));
    }

    @GetMapping("/olympiads/{olympiadId}/participants")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<?> getOlympiadParticipants(@PathVariable UUID olympiadId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(participationService.getOlympiadParticipants(olympiadId, auth.getName()));
    }

    @GetMapping("/olympiads/{olympiadId}/manual-review")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<?> getManualReviewQueue(@PathVariable UUID olympiadId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(participationService.getManualReviewQueue(olympiadId, auth.getName()));
    }

    @PostMapping("/answers/{answerId}/review")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<?> reviewAnswer(
            @PathVariable String answerId,
            @Valid @RequestBody ReviewAnswerRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(participationService.reviewAnswer(answerId, request, auth.getName()));
    }
}
