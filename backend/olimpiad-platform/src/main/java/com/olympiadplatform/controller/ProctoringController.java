package com.olympiadplatform.controller;

import com.olympiadplatform.dto.request.ProctoringEventRequest;
import com.olympiadplatform.dto.response.ApiResponse;
import com.olympiadplatform.service.ProctoringService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/proctoring")
@RequiredArgsConstructor
public class ProctoringController {
    
    private final ProctoringService proctoringService;
    
    @PostMapping("/event")
    public ResponseEntity<ApiResponse> logEvent(
            @Valid @RequestBody ProctoringEventRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        proctoringService.logEvent(request, userDetails.getUsername());
        return ResponseEntity.ok(new ApiResponse(true, "Event logged successfully"));
    }
}