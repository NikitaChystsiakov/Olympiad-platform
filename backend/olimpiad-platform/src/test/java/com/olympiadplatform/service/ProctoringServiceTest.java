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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProctoringServiceTest {

    @Mock
    private ProctoringEventRepository eventRepository;
    @Mock
    private CheatingDetectionService cheatingDetectionService;
    @Mock
    private ParticipationRepository participationRepository;
    @Mock
    private OlympiadRepository olympiadRepository;
    @Mock
    private UserRepository userRepository;

    private ProctoringService service;
    private UUID olympiadId;
    private Olympiad olympiad;
    private User student;

    @BeforeEach
    void setUp() {
        service = new ProctoringService(eventRepository, cheatingDetectionService, participationRepository,
                olympiadRepository, userRepository);
        olympiadId = UUID.randomUUID();
        olympiad = Olympiad.builder()
                .id(olympiadId)
                .title("Olympiad")
                .createdBy("org@test.com")
                .durationMinutes(60)
                .status(Olympiad.OlympiadStatus.PUBLISHED)
                .build();
        student = User.builder().id("u-1").email("student@test.com").fullName("Student").role(User.Role.STUDENT).build();
    }

    @Test
    void logEventStoresFlaggedEventLinkedToActiveAttempt() {
        Participation attempt = attempt("p-1", student);
        when(userRepository.findByEmail("student@test.com")).thenReturn(Optional.of(student));
        when(participationRepository.findActiveByUserIdAndOlympiadId("u-1", olympiadId, Participation.ParticipationStatus.ACTIVE))
                .thenReturn(Optional.of(attempt));
        when(cheatingDetectionService.analyzeEvent(any())).thenReturn(true);

        service.logEvent(request("multiple_faces"), "student@test.com");

        ArgumentCaptor<ProctoringEvent> saved = ArgumentCaptor.forClass(ProctoringEvent.class);
        verify(eventRepository).save(saved.capture());
        assertThat(saved.getValue().getEventType()).isEqualTo(ProctoringEvent.EventType.MULTIPLE_FACES);
        assertThat(saved.getValue().getSessionId()).isEqualTo("p-1");
        assertThat(saved.getValue().isFlagged()).isTrue();
    }

    @Test
    void logEventRejectsUnknownTypeAndMissingAttempt() {
        assertThatThrownBy(() -> service.logEvent(request("TELEPORT"), "student@test.com"))
                .isInstanceOf(BusinessException.class);

        when(userRepository.findByEmail("student@test.com")).thenReturn(Optional.of(student));
        when(participationRepository.findActiveByUserIdAndOlympiadId(eq("u-1"), eq(olympiadId), any()))
                .thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.logEvent(request("TAB_SWITCH"), "student@test.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Нет активной попытки");
        verify(eventRepository, never()).save(any());
    }

    @Test
    void reportAggregatesEventsPerParticipantAndRanksByRisk() {
        User calm = User.builder().id("u-2").email("calm@test.com").fullName("Calm").role(User.Role.STUDENT).build();
        User organizer = User.builder().email("org@test.com").role(User.Role.ORGANIZER).build();
        when(olympiadRepository.findById(olympiadId)).thenReturn(Optional.of(olympiad));
        when(userRepository.findByEmail("org@test.com")).thenReturn(Optional.of(organizer));
        when(participationRepository.findWithUserAndOlympiadByOlympiadId(olympiadId))
                .thenReturn(List.of(attempt("p-1", student), attempt("p-2", calm)));
        when(eventRepository.findByOlympiadIdOrderByTimestampDesc(olympiadId.toString())).thenReturn(List.of(
                event("student@test.com", ProctoringEvent.EventType.MULTIPLE_FACES, true),
                event("student@test.com", ProctoringEvent.EventType.TAB_SWITCH, false),
                event("calm@test.com", ProctoringEvent.EventType.TAB_SWITCH, false)
        ));

        ProctoringReportResponse report = service.getReport(olympiadId, "org@test.com");

        assertThat(report.totalEvents()).isEqualTo(3);
        assertThat(report.flaggedEvents()).isEqualTo(1);
        assertThat(report.participants()).extracting(ProctoringReportResponse.Participant::email)
                .containsExactly("student@test.com", "calm@test.com");
        assertThat(report.participants().get(0).riskLevel()).isEqualTo(ProctoringReportResponse.RiskLevel.HIGH);
        assertThat(report.participants().get(0).countsByType()).containsEntry("TAB_SWITCH", 1L);
        assertThat(report.participants().get(1).riskLevel()).isEqualTo(ProctoringReportResponse.RiskLevel.LOW);
        assertThat(report.events()).extracting(ProctoringReportResponse.Event::userName).contains("Student", "Calm");
    }

    @Test
    void reportIsForbiddenForForeignOrganizer() {
        User other = User.builder().email("other@test.com").role(User.Role.ORGANIZER).build();
        when(olympiadRepository.findById(olympiadId)).thenReturn(Optional.of(olympiad));
        when(userRepository.findByEmail("other@test.com")).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> service.getReport(olympiadId, "other@test.com"))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void riskLevelThresholds() {
        assertThat(ProctoringService.riskLevel(0, 0, Map.of())).isEqualTo(ProctoringReportResponse.RiskLevel.LOW);
        assertThat(ProctoringService.riskLevel(5, 0, Map.of())).isEqualTo(ProctoringReportResponse.RiskLevel.MEDIUM);
        assertThat(ProctoringService.riskLevel(3, 1, Map.of())).isEqualTo(ProctoringReportResponse.RiskLevel.MEDIUM);
        assertThat(ProctoringService.riskLevel(6, 3, Map.of())).isEqualTo(ProctoringReportResponse.RiskLevel.HIGH);
    }

    private ProctoringEventRequest request(String type) {
        ProctoringEventRequest request = new ProctoringEventRequest();
        request.setOlympiadId(olympiadId.toString());
        request.setEventType(type);
        request.setMetadata("test");
        return request;
    }

    private Participation attempt(String id, User user) {
        return Participation.builder()
                .id(id)
                .user(user)
                .olympiad(olympiad)
                .startedAt(LocalDateTime.now().minusMinutes(5))
                .status(Participation.ParticipationStatus.ACTIVE)
                .build();
    }

    private ProctoringEvent event(String email, ProctoringEvent.EventType type, boolean flagged) {
        return ProctoringEvent.builder()
                .id(UUID.randomUUID().toString())
                .userId(email)
                .olympiadId(olympiadId.toString())
                .eventType(type)
                .timestamp(LocalDateTime.now())
                .isFlagged(flagged)
                .build();
    }
}
