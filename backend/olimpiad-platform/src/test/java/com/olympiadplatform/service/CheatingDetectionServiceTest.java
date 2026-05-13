package com.olympiadplatform.service;

import com.olympiadplatform.entity.ProctoringEvent;
import com.olympiadplatform.repository.ProctoringEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CheatingDetectionServiceTest {

    @Mock
    private ProctoringEventRepository proctoringEventRepository;

    private CheatingDetectionService service;

    @BeforeEach
    void setUp() {
        service = new CheatingDetectionService(proctoringEventRepository);
    }

    @Test
    void multipleFacesIsAlwaysFlagged() {
        boolean flagged = service.analyzeEvent(event(ProctoringEvent.EventType.MULTIPLE_FACES));

        assertThat(flagged).isTrue();
    }

    @Test
    void tabSwitchIsFlaggedWhenThereAreMoreThanThreeRecentSwitches() {
        when(proctoringEventRepository.findByUserIdAndOlympiadIdAndEventTypeAndTimestampAfter(
                eq("user-1"),
                eq("olympiad-1"),
                eq(ProctoringEvent.EventType.TAB_SWITCH),
                any(LocalDateTime.class)
        )).thenReturn(List.of(event(ProctoringEvent.EventType.TAB_SWITCH), event(ProctoringEvent.EventType.TAB_SWITCH),
                event(ProctoringEvent.EventType.TAB_SWITCH), event(ProctoringEvent.EventType.TAB_SWITCH)));

        boolean flagged = service.analyzeEvent(event(ProctoringEvent.EventType.TAB_SWITCH));

        assertThat(flagged).isTrue();
    }

    @Test
    void fullscreenExitIsNotFlaggedWhenThresholdIsNotExceeded() {
        when(proctoringEventRepository.findByUserIdAndOlympiadIdAndEventTypeAndTimestampAfter(
                eq("user-1"),
                eq("olympiad-1"),
                eq(ProctoringEvent.EventType.FULLSCREEN_EXIT),
                any(LocalDateTime.class)
        )).thenReturn(Collections.nCopies(2, event(ProctoringEvent.EventType.FULLSCREEN_EXIT)));

        boolean flagged = service.analyzeEvent(event(ProctoringEvent.EventType.FULLSCREEN_EXIT));

        assertThat(flagged).isFalse();
    }

    @Test
    void faceMissingIsFlaggedWhenRecentEventsThresholdIsExceeded() {
        when(proctoringEventRepository.findByUserIdAndOlympiadIdAndTimestampAfter(
                eq("user-1"),
                eq("olympiad-1"),
                any(LocalDateTime.class)
        )).thenReturn(Collections.nCopies(3, event(ProctoringEvent.EventType.FACE_MISSING)));

        boolean flagged = service.analyzeEvent(event(ProctoringEvent.EventType.FACE_MISSING));

        assertThat(flagged).isTrue();
    }

    private ProctoringEvent event(ProctoringEvent.EventType type) {
        return ProctoringEvent.builder()
                .userId("user-1")
                .olympiadId("olympiad-1")
                .eventType(type)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
