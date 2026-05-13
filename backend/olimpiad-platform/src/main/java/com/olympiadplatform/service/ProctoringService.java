package com.olympiadplatform.service;

import com.olympiadplatform.dto.request.ProctoringEventRequest;
import com.olympiadplatform.entity.ProctoringEvent;
import com.olympiadplatform.repository.ProctoringEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProctoringService {
    
    private final ProctoringEventRepository proctoringEventRepository;
    private final CheatingDetectionService cheatingDetectionService;
    
    @Transactional
    public void logEvent(ProctoringEventRequest request, String userId) {
        ProctoringEvent.EventType eventType;
        try {
            eventType = ProctoringEvent.EventType.valueOf(request.getEventType().toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown event type: {}", request.getEventType());
            eventType = ProctoringEvent.EventType.TAB_SWITCH;
        }
        
        ProctoringEvent event = ProctoringEvent.builder()
                .userId(userId)
                .olympiadId(request.getOlympiadId())
                .sessionId(request.getSessionId())
                .eventType(eventType)
                .metadata(request.getMetadata())
                .timestamp(LocalDateTime.now())
                .isFlagged(false)
                .build();
        
        // Check if this event should be flagged as cheating
        boolean flagged = cheatingDetectionService.analyzeEvent(event);
        event.setFlagged(flagged);
        
        proctoringEventRepository.save(event);
        
        if (flagged) {
            log.warn("Flagged cheating event for user {}: {}", userId, eventType);
        }
    }
}