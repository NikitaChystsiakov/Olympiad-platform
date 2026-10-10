package com.olympiadplatform.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record ProctoringReportResponse(
        String olympiadId,
        String olympiadTitle,
        long totalEvents,
        long flaggedEvents,
        List<Participant> participants,
        List<Event> events
) {
    public enum RiskLevel { LOW, MEDIUM, HIGH }

    public record Participant(
            String email,
            String fullName,
            String participationId,
            String participationStatus,
            long totalEvents,
            long flaggedEvents,
            Map<String, Long> countsByType,
            LocalDateTime lastEventAt,
            RiskLevel riskLevel
    ) {}

    public record Event(
            String id,
            String userEmail,
            String userName,
            String eventType,
            String metadata,
            LocalDateTime timestamp,
            boolean flagged
    ) {}
}
