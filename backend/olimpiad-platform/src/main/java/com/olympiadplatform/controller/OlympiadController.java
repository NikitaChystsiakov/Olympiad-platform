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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import java.util.Map;

import java.util.UUID;

@RestController
@RequestMapping("/api/olympiads")
@RequiredArgsConstructor
public class OlympiadController {

    private final OlympiadService olympiadService;

    @GetMapping
    public ResponseEntity<Page<OlympiadResponse>> getAllOlympiads(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        Olympiad.OlympiadStatus olympiadStatus = null;
        if (status != null && !status.isEmpty()) {
            try {
                olympiadStatus = Olympiad.OlympiadStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Если статус не распознан, возвращаем все
            }
        }
        return ResponseEntity.ok(olympiadService.getAllOlympiads(olympiadStatus, search, pageable)
                .map(this::toResponse));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OlympiadResponse> getOlympiad(@PathVariable UUID id) {
        return ResponseEntity.ok(toResponse(olympiadService.getOlympiadById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<?> createOlympiad(@RequestBody OlympiadCreateRequest request) {
        
        // Получаем email из SecurityContext
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Не авторизован"));
        }
        
        String email = authentication.getName();
        
        System.out.println("📥 === CREATE OLYMPIAD ===");
        System.out.println("📥 Auth: " + (authentication != null));
        System.out.println("📥 Principal: " + authentication.getPrincipal());
        System.out.println("📥 Email: " + email);
        System.out.println("📥 Title: " + request.getTitle());
        System.out.println("📥 Start: " + request.getStartTime());
        System.out.println("📥 End: " + request.getEndTime());
        
        if (email == null || email.equals("anonymousUser")) {
            return ResponseEntity.status(401).body(Map.of("error", "Пользователь не найден в токене"));
        }
        
        return ResponseEntity.ok(toResponse(olympiadService.createOlympiad(request, email)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<?> updateOlympiad(
            @PathVariable UUID id,
            @Valid @RequestBody OlympiadUpdateRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return ResponseEntity.ok(toResponse(olympiadService.updateOlympiad(id, request, email)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteOlympiad(@PathVariable UUID id) {
        olympiadService.deleteOlympiad(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<?> publishOlympiad(@PathVariable UUID id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        
        System.out.println("📥 PUBLISH - ID: " + id + ", User: " + email);
        
        return ResponseEntity.ok(toResponse(olympiadService.publishOlympiad(id, email)));
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
                .createdAt(olympiad.getCreatedAt())
                .updatedAt(olympiad.getUpdatedAt())
                .build();
    }
}
