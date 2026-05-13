package com.olympiadplatform.dto.response;

import com.olympiadplatform.entity.Participation;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class OlympiadParticipantResponse {
    private String participationId;
    private String userName;
    private String userEmail;
    private Integer score;
    private Integer maxPossibleScore;
    private Integer place;
    private Boolean pendingReview;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private Participation.ParticipationStatus status;
}
