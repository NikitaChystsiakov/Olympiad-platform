package com.olympiadplatform.controller;

import com.olympiadplatform.dto.response.FileAttachmentResponse;
import com.olympiadplatform.service.FileAttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class AttachmentController {

    private final FileAttachmentService fileAttachmentService;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @PostMapping("/api/participations/{participationId}/questions/{questionId}/attachments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FileAttachmentResponse> uploadAttachment(
            @PathVariable String participationId,
            @PathVariable String questionId,
            @RequestParam("file") MultipartFile file) throws IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return ResponseEntity.ok(fileAttachmentService.uploadFile(participationId, questionId, email, file));
    }

    @GetMapping("/api/participations/{participationId}/questions/{questionId}/attachments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<FileAttachmentResponse>> getAttachments(
            @PathVariable String participationId,
            @PathVariable String questionId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return ResponseEntity.ok(fileAttachmentService.getAttachments(participationId, questionId, email));
    }

    @DeleteMapping("/api/attachments/{attachmentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteAttachment(
            @PathVariable String attachmentId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        fileAttachmentService.deleteAttachment(attachmentId, email);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/files/{fileName}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        Path filePath = Paths.get(uploadDir).toAbsolutePath().resolve(fileName).normalize();
        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }
        String originalName = fileAttachmentService.getOriginalFileName(fileName);
        FileSystemResource resource = new FileSystemResource(filePath.toFile());
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + originalName + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
}
