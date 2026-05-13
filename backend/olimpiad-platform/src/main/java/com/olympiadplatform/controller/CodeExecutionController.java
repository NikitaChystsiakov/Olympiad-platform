package com.olympiadplatform.controller;

import com.olympiadplatform.dto.request.RunCodeRequest;
import com.olympiadplatform.dto.response.RunCodeResponse;
import com.olympiadplatform.service.Judge0Service;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/code")
@RequiredArgsConstructor
public class CodeExecutionController {

    private final Judge0Service judge0Service;

    @PostMapping("/run")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RunCodeResponse> runCode(@Valid @RequestBody RunCodeRequest request) {
        return ResponseEntity.ok(judge0Service.run(request));
    }
}
