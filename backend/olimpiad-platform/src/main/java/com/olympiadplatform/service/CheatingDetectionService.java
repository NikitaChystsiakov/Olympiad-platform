package com.olympiadplatform.service;

import com.olympiadplatform.entity.ProctoringEvent;
import com.olympiadplatform.repository.ProctoringEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;

/**
 * Decides whether a proctoring signal is suspicious. Each event type has a tolerance: how many
 * events of that type within the window are acceptable before new ones get flagged.
 */
@Service
@RequiredArgsConstructor
public class CheatingDetectionService {

    static final Duration WINDOW = Duration.ofMinutes(5);

    /** Number of earlier events of the same type in {@link #WINDOW} that are still tolerated. */
    private static final Map<ProctoringEvent.EventType, Integer> TOLERANCE = Map.of(
            ProctoringEvent.EventType.TAB_SWITCH, 3,
            ProctoringEvent.EventType.FULLSCREEN_EXIT, 2,
            ProctoringEvent.EventType.FACE_MISSING, 1,
            ProctoringEvent.EventType.COPY_PASTE, 2
    );

    private final ProctoringEventRepository proctoringEventRepository;

    public boolean analyzeEvent(ProctoringEvent event) {
        return switch (event.getEventType()) {
            case MULTIPLE_FACES, CAMERA_UNAVAILABLE, SCREEN_RECORDING -> true;
            case SUSPICIOUS_SOUND -> false;
            default -> countRecent(event) > TOLERANCE.getOrDefault(event.getEventType(), Integer.MAX_VALUE);
        };
    }

    private int countRecent(ProctoringEvent event) {
        return proctoringEventRepository.findByUserIdAndOlympiadIdAndEventTypeAndTimestampAfter(
                event.getUserId(),
                event.getOlympiadId(),
                event.getEventType(),
                event.getTimestamp().minus(WINDOW)
        ).size();
    }
}
