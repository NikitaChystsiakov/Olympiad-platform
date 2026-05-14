package com.olympiadplatform.dto.response;

import java.time.LocalDateTime;

public record FileAttachmentResponse(
    String id,
    String originalName,
    String mimeType,
    long size,
    String url,
    LocalDateTime createdAt
) {}