package com.olympiadplatform.service;

import com.olympiadplatform.dto.request.ProctoringEventRequest;
import com.olympiadplatform.dto.response.ProctoringReportResponse;
import com.olympiadplatform.entity.Olympiad;
import com.olympiadplatform.entity.Participation;
import com.olympiadplatform.entity.ProctoringEvent;
import com.olympiadplatform.entity.User;
import com.olympiadplatform.exception.BusinessException;
import com.olympiadplatform.repository.OlympiadRepository;
import com.olympiadplatform.repository.ParticipationRepository;
import com.olympiadplatform.repository.ProctoringEventRepository;
import com.olympiadplatform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProctoringService {

    private static final int MAX_EVENTS_IN_REPORT = 500;

    private final ProctoringEventRepository proctoringEventRepository;
    private final CheatingDetectionService cheatingDetectionService;
    private final ParticipationRepository participationRepository;
    private final OlympiadRepository olympiadRepository;
    private final UserRepository userRepository;

    @Transactional
    public void logEvent(ProctoringEventRequest request, String userEmail) {
        ProctoringEvent.EventType eventType;
        UUID olympiadId;
        try {
            eventType = ProctoringEvent.EventType.valueOf(request.getEventType().toUpperCase());
            olympiadId = UUID.fromString(request.getOlympiadId());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Некорректное событие прокторинга");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> BusinessException.notFound("Пользователь не найден"));
        Participation participation = participationRepository.findActiveByUserIdAndOlympiadId(
                        user.getId(), olympiadId, Participation.ParticipationStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException("Нет активной попытки"));

        String metadata = request.getMetadata();
        if (metadata != null && metadata.length() > 1000) {
            metadata = metadata.substring(0, 1000);
        }

        ProctoringEvent event = ProctoringEvent.builder()
                .userId(userEmail)
                .olympiadId(olympiadId.toString())
                .sessionId(participation.getId())
                .eventType(eventType)
                .metadata(metadata)
                .timestamp(LocalDateTime.now())
                .build();

        event.setFlagged(cheatingDetectionService.analyzeEvent(event));
        proctoringEventRepository.save(event);

        if (event.isFlagged()) {
            log.warn("Flagged proctoring event for {}: {}", userEmail, eventType);
        }
    }

    @Transactional(readOnly = true)
    public ProctoringReportResponse getReport(UUID olympiadId, String viewerEmail) {
        Olympiad olympiad = olympiadRepository.findById(olympiadId)
                .orElseThrow(() -> BusinessException.notFound("Олимпиада не найдена"));
        User viewer = userRepository.findByEmail(viewerEmail)
                .orElseThrow(() -> BusinessException.notFound("Пользователь не найден"));
        if (viewer.getRole() != User.Role.ADMIN && !olympiad.getCreatedBy().equals(viewerEmail)) {
            throw BusinessException.forbidden("Доступ запрещён");
        }

        List<ProctoringEvent> events = proctoringEventRepository.findByOlympiadIdOrderByTimestampDesc(olympiadId.toString());
        Map<String, List<ProctoringEvent>> eventsByUser = events.stream()
                .collect(Collectors.groupingBy(ProctoringEvent::getUserId));

        // Latest attempt per student; students without any events are still listed.
        Map<String, Participation> latestAttempt = new LinkedHashMap<>();
        participationRepository.findWithUserAndOlympiadByOlympiadId(olympiadId).stream()
                .sorted(Comparator.comparing(Participation::getStartedAt))
                .forEach(participation -> latestAttempt.put(participation.getUser().getEmail(), participation));

        Map<String, String> names = latestAttempt.values().stream()
                .collect(Collectors.toMap(p -> p.getUser().getEmail(), p -> p.getUser().getFullName(), (a, b) -> a));

        List<ProctoringReportResponse.Participant> participants = latestAttempt.values().stream()
                .map(participation -> toParticipant(participation, eventsByUser.getOrDefault(participation.getUser().getEmail(), List.of())))
                .sorted(Comparator
                        .comparing(ProctoringReportResponse.Participant::riskLevel, Comparator.reverseOrder())
                        .thenComparing(ProctoringReportResponse.Participant::flaggedEvents, Comparator.reverseOrder())
                        .thenComparing(ProctoringReportResponse.Participant::fullName))
                .toList();

        List<ProctoringReportResponse.Event> recentEvents = events.stream()
                .limit(MAX_EVENTS_IN_REPORT)
                .map(event -> new ProctoringReportResponse.Event(
                        event.getId(),
                        event.getUserId(),
                        names.getOrDefault(event.getUserId(), event.getUserId()),
                        event.getEventType().name(),
                        event.getMetadata(),
                        event.getTimestamp(),
                        event.isFlagged()))
                .toList();

        return new ProctoringReportResponse(
                olympiad.getId().toString(),
                olympiad.getTitle(),
                events.size(),
                events.stream().filter(ProctoringEvent::isFlagged).count(),
                participants,
                recentEvents
        );
    }

    private ProctoringReportResponse.Participant toParticipant(Participation participation, List<ProctoringEvent> events) {
        Map<String, Long> countsByType = events.stream()
                .collect(Collectors.groupingBy(event -> event.getEventType().name(), TreeMap::new, Collectors.counting()));
        long flagged = events.stream().filter(ProctoringEvent::isFlagged).count();
        LocalDateTime lastEventAt = events.isEmpty() ? null : events.get(0).getTimestamp();

        return new ProctoringReportResponse.Participant(
                participation.getUser().getEmail(),
                participation.getUser().getFullName(),
                participation.getId(),
                participation.getStatus().name(),
                events.size(),
                flagged,
                countsByType,
                lastEventAt,
                riskLevel(events.size(), flagged, countsByType)
        );
    }

    static ProctoringReportResponse.RiskLevel riskLevel(long total, long flagged, Map<String, Long> countsByType) {
        if (flagged >= 3 || countsByType.getOrDefault("MULTIPLE_FACES", 0L) > 0) {
            return ProctoringReportResponse.RiskLevel.HIGH;
        }
        if (flagged >= 1 || total >= 5) {
            return ProctoringReportResponse.RiskLevel.MEDIUM;
        }
        return ProctoringReportResponse.RiskLevel.LOW;
    }
}
