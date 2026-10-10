package com.olympiadplatform.controller;

import com.olympiadplatform.dto.request.ProctoringEventRequest;
import com.olympiadplatform.dto.response.ApiResponse;
import com.olympiadplatform.dto.response.ProctoringReportResponse;
import com.olympiadplatform.service.ProctoringService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/proctoring")
@RequiredArgsConstructor
public class ProctoringController {

    private final ProctoringService proctoringService;

    @PostMapping("/event")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse logEvent(@Valid @RequestBody ProctoringEventRequest request, Authentication auth) {
        proctoringService.logEvent(request, auth.getName());
        return new ApiResponse(true, "Событие записано");
    }

    @GetMapping("/olympiads/{olympiadId}/report")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ProctoringReportResponse getReport(@PathVariable UUID olympiadId, Authentication auth) {
        return proctoringService.getReport(olympiadId, auth.getName());
    }
}
