package com.olympiadplatform.dto.response;

import com.olympiadplatform.entity.Participation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipationSummaryResponse {
    private String id;
    private String olympiadId;
    private String olympiadTitle;
    private LocalDateTime startedAt;
    private LocalDateTime deadline;
    private LocalDateTime finishedAt;
    private Integer score;
    private Integer maxPossibleScore;
    private Participation.ParticipationStatus status;

    public static ParticipationSummaryResponse from(Participation participation) {
        var olympiad = participation.getOlympiad();
        return ParticipationSummaryResponse.builder()
                .id(participation.getId())
                .olympiadId(olympiad.getId().toString())
                .olympiadTitle(olympiad.getTitle())
                .startedAt(participation.getStartedAt())
                .deadline(participation.getStartedAt().plusMinutes(olympiad.getDurationMinutes()))
                .finishedAt(participation.getFinishedAt())
                .score(participation.getScore())
                .maxPossibleScore(olympiad.getQuestions().stream().mapToInt(q -> q.getPoints() == null ? 0 : q.getPoints()).sum())
                .status(participation.getStatus())
                .build();
    }
}
