package com.olympiadplatform.service;

import com.olympiadplatform.entity.ProctoringEvent;
import com.olympiadplatform.repository.ProctoringEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CheatingDetectionService {
    
    private final ProctoringEventRepository proctoringEventRepository;
    
    public boolean analyzeEvent(ProctoringEvent event) {
        int recentEvents = countRecentEvents(event.getUserId(), event.getOlympiadId(), event.getTimestamp().minusMinutes(5));
        
        // Strategy pattern in action
        switch (event.getEventType()) {
            case TAB_SWITCH:
                // Flag if more than 3 tab switches in 5 minutes
                return countEventsByType(event.getUserId(), event.getOlympiadId(), 
                        ProctoringEvent.EventType.TAB_SWITCH, event.getTimestamp().minusMinutes(5)) > 3;
                
            case FULLSCREEN_EXIT:
                // Flag if more than 2 fullscreen exits
                return countEventsByType(event.getUserId(), event.getOlympiadId(),
                        ProctoringEvent.EventType.FULLSCREEN_EXIT, event.getTimestamp().minusMinutes(5)) > 2;
                
            case FACE_MISSING:
                // Flag if face missing for more than 10 seconds (approx 2 events)
                return recentEvents > 2;
                
            case MULTIPLE_FACES:
                // Always flag multiple faces detected
                return true;
                
            default:
                return false;
        }
    }
    
    private int countRecentEvents(String userId, String olympiadId, LocalDateTime since) {
        List<ProctoringEvent> events = proctoringEventRepository
                .findByUserIdAndOlympiadIdAndTimestampAfter(userId, olympiadId, since);
        return events.size();
    }
    
    private int countEventsByType(String userId, String olympiadId, ProctoringEvent.EventType type, LocalDateTime since) {
        List<ProctoringEvent> events = proctoringEventRepository
                .findByUserIdAndOlympiadIdAndEventTypeAndTimestampAfter(userId, olympiadId, type, since);
        return events.size();
    }
}