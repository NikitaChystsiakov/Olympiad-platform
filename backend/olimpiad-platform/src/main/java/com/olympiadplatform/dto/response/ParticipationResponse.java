package com.olympiadplatform.dto.response;

import com.olympiadplatform.entity.Participation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipationResponse {
    private String participationId;
    private String olympiadId;
    private String olympiadTitle;
    private String userName;
    private String userEmail;
    private Integer totalScore;
    private Integer maxPossibleScore;
    private Integer place;
    private Boolean pendingReview;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private Participation.ParticipationStatus status;
    private List<AnswerResultResponse> answers;
}
