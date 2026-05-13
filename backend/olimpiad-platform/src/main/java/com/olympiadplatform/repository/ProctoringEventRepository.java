package com.olympiadplatform.repository;

import com.olympiadplatform.entity.ProctoringEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProctoringEventRepository extends JpaRepository<ProctoringEvent, String> {
    List<ProctoringEvent> findByUserIdAndOlympiadId(String userId, String olympiadId);
    
    List<ProctoringEvent> findByUserIdAndOlympiadIdAndTimestampAfter(String userId, String olympiadId, LocalDateTime timestamp);
    
    List<ProctoringEvent> findByUserIdAndOlympiadIdAndEventTypeAndTimestampAfter(
            String userId, String olympiadId, ProctoringEvent.EventType eventType, LocalDateTime timestamp);
}