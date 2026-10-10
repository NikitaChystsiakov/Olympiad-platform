package com.olympiadplatform.service;

import com.olympiadplatform.dto.request.ReviewAnswerRequest;
import com.olympiadplatform.dto.response.AnswerResultResponse;
import com.olympiadplatform.dto.response.FileAttachmentResponse;
import com.olympiadplatform.dto.response.ManualReviewResponse;
import com.olympiadplatform.dto.response.OlympiadParticipantResponse;
import com.olympiadplatform.dto.response.ParticipationResponse;
import com.olympiadplatform.dto.response.ParticipationSummaryResponse;
import com.olympiadplatform.dto.response.SavedAnswerResponse;
import com.olympiadplatform.entity.*;
import com.olympiadplatform.exception.BusinessException;
import com.olympiadplatform.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParticipationService {

    /** Answers that arrive slightly after the deadline (debounced input, network) are still accepted. */
    private static final long SUBMIT_GRACE_SECONDS = 15;

    private final ParticipationRepository participationRepository;
    private final OlympiadRepository olympiadRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final UserRepository userRepository;
    private final FileAttachmentRepository fileAttachmentRepository;

    @NonNull
    @Transactional
    public Participation startParticipation(@NonNull UUID olympiadId, @NonNull String userEmail) {
        Olympiad olympiad = olympiadRepository.findById(olympiadId)
                .orElseThrow(() -> BusinessException.notFound("Олимпиада не найдена"));

        if (olympiad.getStatus() != Olympiad.OlympiadStatus.PUBLISHED &&
            olympiad.getStatus() != Olympiad.OlympiadStatus.ACTIVE) {
            throw new BusinessException("Олимпиада недоступна для участия");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> BusinessException.notFound("Пользователь не найден"));

        LocalDateTime now = LocalDateTime.now();

        var activeParticipation = participationRepository.findActiveByUserIdAndOlympiadId(
                user.getId(),
                olympiadId,
                Participation.ParticipationStatus.ACTIVE
        );
        if (activeParticipation.isPresent()) {
            Participation existing = activeParticipation.get();
            LocalDateTime deadline = existing.getStartedAt().plusMinutes(olympiad.getDurationMinutes());
            if (now.isBefore(deadline)) {
                return existing;
            }

            completeAttempt(existing, deadline);
        }

        if (now.plusSeconds(30).isBefore(olympiad.getStartTime())) {
            throw new BusinessException("Олимпиада ещё не началась");
        }

        if (now.isAfter(olympiad.getEndTime())) {
            throw new BusinessException("Олимпиада уже завершилась");
        }


        Participation participation = Participation.builder()
                .user(user)
                .olympiad(olympiad)
                .startedAt(now)
                .status(Participation.ParticipationStatus.ACTIVE)
                .score(0)
                .build();

        return participationRepository.save(participation);
    }

    @NonNull
    @Transactional(noRollbackFor = BusinessException.class)
    public Answer submitAnswer(@NonNull String participationId, @NonNull String questionId,
                               String answer, @NonNull String userEmail) {
        Participation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> BusinessException.notFound("Участие не найдено"));

        if (!participation.getUser().getEmail().equals(userEmail)) {
            throw BusinessException.forbidden("Доступ запрещён");
        }

        if (participation.getStatus() != Participation.ParticipationStatus.ACTIVE) {
            throw new BusinessException("Участие неактивно");
        }

        LocalDateTime now = LocalDateTime.now();

        Olympiad olympiad = participation.getOlympiad();
        LocalDateTime deadline = deadlineOf(participation);

        if (now.isAfter(deadline.plusSeconds(SUBMIT_GRACE_SECONDS))) {
            completeAttempt(participation, deadline);
            throw new BusinessException("Время олимпиады истекло");
        }

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> BusinessException.notFound("Вопрос не найден"));

        if (!question.getOlympiad().getId().equals(olympiad.getId())) {
            throw new BusinessException("Вопрос не относится к этой олимпиаде");
        }

        String safeAnswer = answer == null ? "" : answer;
        boolean needsManualReview = question.getType() == Question.QuestionType.MANUAL_REVIEW ||
                question.getType() == Question.QuestionType.CODE;
        boolean isCorrect = !needsManualReview && checkAnswer(question, safeAnswer);
        Integer pointsEarned = needsManualReview ? null : (isCorrect ? question.getPoints() : 0);

        var existingAnswer = answerRepository.findByParticipationIdAndQuestionId(participationId, questionId);
        if (existingAnswer.isPresent()) {
            Answer savedAnswer = existingAnswer.get();
            savedAnswer.setAnswer(safeAnswer);
            savedAnswer.setIsCorrect(isCorrect);
            savedAnswer.setPointsEarned(pointsEarned);
            if (needsManualReview) {
                savedAnswer.setReviewComment(null);
            }
            savedAnswer.setSubmittedAt(now);
            return answerRepository.save(savedAnswer);
        }

        Answer newAnswer = Answer.builder()
                .participation(participation)
                .questionId(questionId)
                .answer(safeAnswer)
                .isCorrect(needsManualReview ? null : isCorrect)
                .pointsEarned(pointsEarned)
                .submittedAt(now)
                .build();

        return answerRepository.save(newAnswer);
    }

    @NonNull
    @Transactional
    public Participation finishParticipation(@NonNull String participationId, @NonNull String userEmail) {
        Participation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> BusinessException.notFound("Участие не найдено"));

        if (!participation.getUser().getEmail().equals(userEmail)) {
            throw BusinessException.forbidden("Доступ запрещён");
        }

        if (participation.getStatus() != Participation.ParticipationStatus.ACTIVE) {
            throw new BusinessException("Участие уже завершено");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime deadline = deadlineOf(participation);
        return completeAttempt(participation, now.isAfter(deadline) ? deadline : now);
    }

    /** Closes attempts whose timer ran out while the student was offline. */
    @Scheduled(fixedDelayString = "${app.participation.expire-check-ms:60000}")
    @Transactional
    public void finishExpiredAttempts() {
        LocalDateTime now = LocalDateTime.now();
        participationRepository.findWithOlympiadByStatus(Participation.ParticipationStatus.ACTIVE).stream()
                .filter(participation -> now.isAfter(deadlineOf(participation).plusSeconds(SUBMIT_GRACE_SECONDS)))
                .forEach(participation -> {
                    completeAttempt(participation, deadlineOf(participation));
                    log.info("Attempt {} finished automatically after deadline", participation.getId());
                });
    }

    @NonNull
    @Transactional(readOnly = true)
    public List<ParticipationSummaryResponse> getMyParticipations(@NonNull String userEmail) {
        return participationRepository.findWithOlympiadByUserEmail(userEmail).stream()
                .map(ParticipationSummaryResponse::from)
                .toList();
    }

    @NonNull
    @Transactional(readOnly = true)
    public List<SavedAnswerResponse> getSavedAnswers(@NonNull String participationId, @NonNull String userEmail) {
        Participation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> BusinessException.notFound("Участие не найдено"));
        if (!participation.getUser().getEmail().equals(userEmail)) {
            throw BusinessException.forbidden("Доступ запрещён");
        }
        return answerRepository.findByParticipationId(participationId).stream()
                .map(answer -> new SavedAnswerResponse(answer.getQuestionId(), answer.getAnswer()))
                .toList();
    }

    @NonNull
    @Transactional(readOnly = true)
    public ParticipationResponse getResults(@NonNull String participationId, @NonNull String userEmail) {
        Participation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> BusinessException.notFound("Участие не найдено"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> BusinessException.notFound("Пользователь не найден"));

        boolean isOwner = participation.getUser().getEmail().equals(userEmail);
        if (!isOwner) {
            ensureCanViewOlympiadResults(participation.getOlympiad(), user);
        } else if (participation.getStatus() == Participation.ParticipationStatus.ACTIVE) {
            // Results contain correct answers, so they are hidden until the attempt is over.
            throw BusinessException.forbidden("Результаты будут доступны после завершения попытки");
        }

        List<Answer> answers = answerRepository.findByParticipationId(participationId);
        List<Question> questions = participation.getOlympiad().getQuestions();
        int maxPossibleScore = participation.getOlympiad().getQuestions().stream()
                .mapToInt(Question::getPoints)
                .sum();
        Map<String, Answer> answersByQuestionId = answers.stream()
                .collect(Collectors.toMap(Answer::getQuestionId, Function.identity(), (first, second) -> second));

        return ParticipationResponse.builder()
                .participationId(participation.getId())
                .olympiadId(participation.getOlympiad().getId().toString())
                .olympiadTitle(participation.getOlympiad().getTitle())
                .userName(participation.getUser().getFullName())
                .userEmail(participation.getUser().getEmail())
                .totalScore(participation.getScore())
                .maxPossibleScore(maxPossibleScore)
                .place(calculatePlace(participation))
                .pendingReview(participation.getStatus() == Participation.ParticipationStatus.PENDING_REVIEW)
                .startedAt(participation.getStartedAt())
                .finishedAt(participation.getFinishedAt())
                .status(participation.getStatus())
                .answers(questions.stream()
                        .map(question -> toAnswerResult(question, answersByQuestionId.get(question.getId())))
                        .toList())
                .build();
    }

    @NonNull
    @Transactional(readOnly = true)
    public List<OlympiadParticipantResponse> getOlympiadParticipants(@NonNull UUID olympiadId, @NonNull String userEmail) {
        Olympiad olympiad = olympiadRepository.findById(olympiadId)
                .orElseThrow(() -> BusinessException.notFound("Олимпиада не найдена"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> BusinessException.notFound("Пользователь не найден"));
        ensureCanViewOlympiadResults(olympiad, user);

        int maxPossibleScore = olympiad.getQuestions().stream().mapToInt(Question::getPoints).sum();
        Map<String, Integer> places = calculatePlaces(olympiadId);
        return participationRepository.findWithUserAndOlympiadByOlympiadId(olympiadId).stream()
                .sorted(participantComparator())
                .map(participation -> OlympiadParticipantResponse.builder()
                        .participationId(participation.getId())
                        .userName(participation.getUser().getFullName())
                        .userEmail(participation.getUser().getEmail())
                        .score(participation.getScore() == null ? 0 : participation.getScore())
                        .maxPossibleScore(maxPossibleScore)
                        .place(places.get(participation.getId()))
                        .pendingReview(participation.getStatus() == Participation.ParticipationStatus.PENDING_REVIEW)
                        .startedAt(participation.getStartedAt())
                        .finishedAt(participation.getFinishedAt())
                        .status(participation.getStatus())
                        .build())
                .toList();
    }

    @NonNull
    @Transactional(readOnly = true)
    public List<ManualReviewResponse> getManualReviewQueue(@NonNull UUID olympiadId, @NonNull String userEmail) {
        Olympiad olympiad = olympiadRepository.findById(olympiadId)
                .orElseThrow(() -> BusinessException.notFound("Олимпиада не найдена"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> BusinessException.notFound("Пользователь не найден"));
        ensureCanViewOlympiadResults(olympiad, user);

        Map<String, Question> questionsById = questionRepository.findByOlympiadId(olympiadId).stream()
                .collect(Collectors.toMap(Question::getId, Function.identity()));

        return answerRepository.findWithParticipationByOlympiadId(olympiadId).stream()
                .filter(answer -> {
                    Question question = questionsById.get(answer.getQuestionId());
                    return question != null && isManualQuestion(question);
                })
                .sorted(Comparator.comparing(answer -> answer.getParticipation().getFinishedAt(), Comparator.nullsLast(Comparator.naturalOrder())))
                .map(answer -> {
                    Question question = questionsById.get(answer.getQuestionId());
                    List<FileAttachmentResponse> files = fileAttachmentRepository.findByAnswerId(answer.getId())
                            .stream()
                            .map(fa -> new FileAttachmentResponse(
                                    fa.getId(),
                                    fa.getOriginalName(),
                                    fa.getMimeType(),
                                    fa.getSize(),
                                    fa.getUrl(),
                                    fa.getCreatedAt()
                            ))
                            .toList();
                    return ManualReviewResponse.builder()
                            .participationId(answer.getParticipation().getId())
                            .answerId(answer.getId())
                            .questionId(question.getId())
                            .questionText(question.getText())
                            .userName(answer.getParticipation().getUser().getFullName())
                            .userEmail(answer.getParticipation().getUser().getEmail())
                            .userAnswer(answer.getAnswer())
                            .pointsEarned(answer.getPointsEarned())
                            .maxPoints(question.getPoints())
                            .reviewComment(answer.getReviewComment())
                            .files(files)
                            .build();
                })
                .toList();
    }

    @NonNull
    @Transactional
    public Answer reviewAnswer(@NonNull String answerId, @NonNull ReviewAnswerRequest request, @NonNull String userEmail) {
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> BusinessException.notFound("Ответ не найден"));
        Participation participation = answer.getParticipation();
        Olympiad olympiad = participation.getOlympiad();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> BusinessException.notFound("Пользователь не найден"));
        ensureCanViewOlympiadResults(olympiad, user);

        Question question = questionRepository.findById(answer.getQuestionId())
                .orElseThrow(() -> BusinessException.notFound("Вопрос не найден"));
        if (!isManualQuestion(question)) {
            throw new BusinessException("Этот вопрос проверяется автоматически");
        }

        int points = request.getPointsEarned() == null ? 0 : request.getPointsEarned();
        if (participation.getStatus() == Participation.ParticipationStatus.ACTIVE) {
            throw new BusinessException("Попытка ещё не завершена");
        }
        if (points > question.getPoints()) {
            throw new BusinessException("Нельзя поставить больше максимального балла");
        }

        answer.setPointsEarned(points);
        answer.setIsCorrect(points == question.getPoints());
        answer.setReviewComment(request.getReviewComment());
        Answer savedAnswer = answerRepository.save(answer);

        List<Answer> answers = answerRepository.findByParticipationId(participation.getId());
        participation.setScore(answers.stream()
                .mapToInt(item -> item.getPointsEarned() == null ? 0 : item.getPointsEarned())
                .sum());
        if (!hasPendingManualReview(participation, answers)) {
            participation.setStatus(Participation.ParticipationStatus.FINISHED);
        }
        participationRepository.save(participation);

        return savedAnswer;
    }

    private LocalDateTime deadlineOf(Participation participation) {
        return participation.getStartedAt().plusMinutes(participation.getOlympiad().getDurationMinutes());
    }

    private Participation completeAttempt(Participation participation, LocalDateTime finishedAt) {
        List<Answer> answers = answerRepository.findByParticipationId(participation.getId());
        participation.setFinishedAt(finishedAt);
        participation.setScore(answers.stream()
                .mapToInt(answer -> answer.getPointsEarned() == null ? 0 : answer.getPointsEarned())
                .sum());
        participation.setStatus(hasPendingManualReview(participation, answers)
                ? Participation.ParticipationStatus.PENDING_REVIEW
                : Participation.ParticipationStatus.FINISHED);
        return participationRepository.save(participation);
    }

    private AnswerResultResponse toAnswerResult(Question question, Answer answer) {
        boolean hasAnswer = answer != null;
        return AnswerResultResponse.builder()
                .questionId(question.getId())
                .questionText(question.getText())
                .questionType(question.getType().name())
                .options(question.getOptions())
                .userAnswer(hasAnswer ? answer.getAnswer() : "")
                .correctAnswer(question.getCorrectAnswer())
                .isCorrect(hasAnswer && Boolean.TRUE.equals(answer.getIsCorrect()))
                .pointsEarned(hasAnswer && answer.getPointsEarned() != null ? answer.getPointsEarned() : 0)
                .maxPoints(question.getPoints())
                .pendingReview(isManualQuestion(question) && (!hasAnswer || answer.getPointsEarned() == null))
                .reviewComment(hasAnswer ? answer.getReviewComment() : null)
                .build();
    }

    private boolean checkAnswer(@NonNull Question question, @NonNull String userAnswer) {
        String correctAnswer = question.getCorrectAnswer() == null ? "" : question.getCorrectAnswer();
        return switch (question.getType()) {
            case SINGLE_CHOICE -> userAnswer.trim().equalsIgnoreCase(correctAnswer.trim());
            case MULTIPLE_CHOICE -> {
                yield Arrays.equals(normalizeAnswerSet(userAnswer), normalizeAnswerSet(correctAnswer));
            }
            case TEXT -> userAnswer.trim().equalsIgnoreCase(correctAnswer.trim());
            case CODE, MANUAL_REVIEW -> false;
        };
    }

    private boolean isManualQuestion(Question question) {
        return question.getType() == Question.QuestionType.MANUAL_REVIEW || question.getType() == Question.QuestionType.CODE;
    }

    private boolean hasPendingManualReview(Participation participation, List<Answer> answers) {
        Map<String, Answer> answersByQuestionId = answers.stream()
                .collect(Collectors.toMap(Answer::getQuestionId, Function.identity(), (first, second) -> second));
        return participation.getOlympiad().getQuestions().stream()
                .filter(this::isManualQuestion)
                .anyMatch(question -> {
                    Answer answer = answersByQuestionId.get(question.getId());
                    return answer != null && answer.getPointsEarned() == null;
                });
    }

    private Integer calculatePlace(Participation participation) {
        if (participation.getStatus() != Participation.ParticipationStatus.FINISHED) {
            return null;
        }
        return calculatePlaces(participation.getOlympiad().getId()).get(participation.getId());
    }

    private Map<String, Integer> calculatePlaces(UUID olympiadId) {
        List<Participation> ranked = participationRepository.findWithUserAndOlympiadByOlympiadId(olympiadId).stream()
                .filter(participation -> participation.getStatus() == Participation.ParticipationStatus.FINISHED)
                .sorted(participantComparator())
                .toList();
        Map<String, Integer> places = new java.util.LinkedHashMap<>();
        for (int i = 0; i < ranked.size(); i++) {
            places.put(ranked.get(i).getId(), i + 1);
        }
        return places;
    }

    private Comparator<Participation> participantComparator() {
        return Comparator
                .comparing((Participation participation) -> participation.getStatus() == Participation.ParticipationStatus.FINISHED ? 0 : 1)
                .thenComparing((Participation participation) -> Optional.ofNullable(participation.getScore()).orElse(0), Comparator.reverseOrder())
                .thenComparing(Participation::getFinishedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(Participation::getStartedAt);
    }

    private void ensureCanViewOlympiadResults(Olympiad olympiad, User user) {
        boolean isOrganizer = user.getRole() == User.Role.ORGANIZER && olympiad.getCreatedBy().equals(user.getEmail());
        boolean isAdmin = user.getRole() == User.Role.ADMIN;
        if (!isOrganizer && !isAdmin) {
            throw BusinessException.forbidden("Доступ запрещён");
        }
    }

    private String[] normalizeAnswerSet(String value) {
        if (value == null || value.isBlank()) {
            return new String[0];
        }
        return Arrays.stream(value.replace("[", "")
                        .replace("]", "")
                        .replace("\"", "")
                        .split("[,|]"))
                .map(String::trim)
                .filter(item -> !item.isEmpty())
                .sorted()
                .toArray(String[]::new);
    }
}
