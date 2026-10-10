package com.olympiadplatform.controller;

import com.olympiadplatform.dto.request.OlympiadCreateRequest;
import com.olympiadplatform.dto.request.OlympiadUpdateRequest;
import com.olympiadplatform.dto.response.OlympiadResponse;
import com.olympiadplatform.entity.Olympiad;
import com.olympiadplatform.service.OlympiadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/olympiads")
@RequiredArgsConstructor
public class OlympiadController {

    private final OlympiadService olympiadService;

    @GetMapping
    public Page<OlympiadResponse> getAllOlympiads(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            Pageable pageable,
            Authentication auth) {
        Olympiad.OlympiadStatus olympiadStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                olympiadStatus = Olympiad.OlympiadStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException ignored) {
                // Unknown status filter: show everything.
            }
        }
        return olympiadService.getAllOlympiads(olympiadStatus, search, auth.getName(), pageable)
                .map(this::toResponse);
    }

    @GetMapping("/{id}")
    public OlympiadResponse getOlympiad(@PathVariable UUID id, Authentication auth) {
        return toResponse(olympiadService.getOlympiadById(id, auth.getName()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public OlympiadResponse createOlympiad(@Valid @RequestBody OlympiadCreateRequest request, Authentication auth) {
        return toResponse(olympiadService.createOlympiad(request, auth.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public OlympiadResponse updateOlympiad(
            @PathVariable UUID id,
            @Valid @RequestBody OlympiadUpdateRequest request,
            Authentication auth) {
        return toResponse(olympiadService.updateOlympiad(id, request, auth.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteOlympiad(@PathVariable UUID id) {
        olympiadService.deleteOlympiad(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public OlympiadResponse publishOlympiad(@PathVariable UUID id, Authentication auth) {
        return toResponse(olympiadService.publishOlympiad(id, auth.getName()));
    }

    private OlympiadResponse toResponse(Olympiad olympiad) {
        return OlympiadResponse.builder()
                .id(olympiad.getId().toString())
                .title(olympiad.getTitle())
                .description(olympiad.getDescription())
                .startTime(olympiad.getStartTime())
                .endTime(olympiad.getEndTime())
                .durationMinutes(olympiad.getDurationMinutes())
                .status(olympiad.getStatus().name())
                .createdBy(olympiad.getCreatedBy())
                .questionCount(olympiad.getQuestions().size())
                .totalPoints(olympiad.getQuestions().stream().mapToInt(q -> q.getPoints() == null ? 0 : q.getPoints()).sum())
                .createdAt(olympiad.getCreatedAt())
                .updatedAt(olympiad.getUpdatedAt())
                .build();
    }
}
