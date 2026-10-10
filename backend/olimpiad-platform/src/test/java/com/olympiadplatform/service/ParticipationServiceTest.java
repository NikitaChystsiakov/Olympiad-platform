package com.olympiadplatform.service;

import com.olympiadplatform.dto.response.ParticipationResponse;
import com.olympiadplatform.entity.Answer;
import com.olympiadplatform.entity.Olympiad;
import com.olympiadplatform.entity.Participation;
import com.olympiadplatform.entity.Question;
import com.olympiadplatform.entity.User;
import com.olympiadplatform.exception.BusinessException;
import com.olympiadplatform.repository.AnswerRepository;
import com.olympiadplatform.repository.FileAttachmentRepository;
import com.olympiadplatform.repository.OlympiadRepository;
import com.olympiadplatform.repository.ParticipationRepository;
import com.olympiadplatform.repository.QuestionRepository;
import com.olympiadplatform.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ParticipationServiceTest {

    @Mock
    private ParticipationRepository participationRepository;

    @Mock
    private OlympiadRepository olympiadRepository;

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private AnswerRepository answerRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FileAttachmentRepository fileAttachmentRepository;

    private ParticipationService service;
    private UUID olympiadId;
    private User student;
    private Olympiad olympiad;

    @BeforeEach
    void setUp() {
        service = new ParticipationService(
                participationRepository,
                olympiadRepository,
                questionRepository,
                answerRepository,
                userRepository,
                fileAttachmentRepository
        );
        olympiadId = UUID.randomUUID();
        student = user("student-1", "student@test.com", User.Role.STUDENT);
        olympiad = olympiad(Olympiad.OlympiadStatus.PUBLISHED);
    }

    @Test
    void startParticipationCreatesActiveAttemptWhenOlympiadIsAvailable() {
        when(olympiadRepository.findById(olympiadId)).thenReturn(Optional.of(olympiad));
        when(userRepository.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        when(participationRepository.findActiveByUserIdAndOlympiadId(
                student.getId(),
                olympiadId,
                Participation.ParticipationStatus.ACTIVE
        )).thenReturn(Optional.empty());
        when(participationRepository.save(any(Participation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Participation result = service.startParticipation(olympiadId, student.getEmail());

        assertThat(result.getUser()).isEqualTo(student);
        assertThat(result.getOlympiad()).isEqualTo(olympiad);
        assertThat(result.getStatus()).isEqualTo(Participation.ParticipationStatus.ACTIVE);
        assertThat(result.getScore()).isZero();
    }

    @Test
    void startParticipationReturnsExistingActiveAttempt() {
        Participation existing = participation("participation-1", student, olympiad);
        when(olympiadRepository.findById(olympiadId)).thenReturn(Optional.of(olympiad));
        when(userRepository.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        when(participationRepository.findActiveByUserIdAndOlympiadId(
                student.getId(),
                olympiadId,
                Participation.ParticipationStatus.ACTIVE
        )).thenReturn(Optional.of(existing));

        Participation result = service.startParticipation(olympiadId, student.getEmail());

        assertThat(result).isSameAs(existing);
        verify(participationRepository, never()).save(any());
    }

    @Test
    void startParticipationFinishesExpiredActiveAttemptAndCreatesFreshAttempt() {
        Participation expired = participation("participation-1", student, olympiad);
        expired.setStartedAt(LocalDateTime.now().minusMinutes(90));
        olympiad.setDurationMinutes(30);
        when(olympiadRepository.findById(olympiadId)).thenReturn(Optional.of(olympiad));
        when(userRepository.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        when(participationRepository.findActiveByUserIdAndOlympiadId(
                student.getId(),
                olympiadId,
                Participation.ParticipationStatus.ACTIVE
        )).thenReturn(Optional.of(expired));
        when(participationRepository.save(any(Participation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Participation result = service.startParticipation(olympiadId, student.getEmail());

        assertThat(expired.getStatus()).isEqualTo(Participation.ParticipationStatus.FINISHED);
        assertThat(expired.getFinishedAt()).isEqualTo(expired.getStartedAt().plusMinutes(30));
        assertThat(result).isNotSameAs(expired);
        assertThat(result.getStatus()).isEqualTo(Participation.ParticipationStatus.ACTIVE);
        assertThat(result.getStartedAt()).isAfter(expired.getStartedAt());
    }

    @Test
    void startParticipationRejectsDraftOlympiad() {
        Olympiad draft = olympiad(Olympiad.OlympiadStatus.DRAFT);
        when(olympiadRepository.findById(olympiadId)).thenReturn(Optional.of(draft));

        assertThatThrownBy(() -> service.startParticipation(olympiadId, student.getEmail()))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void startParticipationAllowsNewAttemptWhenPreviousAttemptIsFinished() {
        when(olympiadRepository.findById(olympiadId)).thenReturn(Optional.of(olympiad));
        when(userRepository.findByEmail(student.getEmail())).thenReturn(Optional.of(student));
        when(participationRepository.findActiveByUserIdAndOlympiadId(
                student.getId(),
                olympiadId,
                Participation.ParticipationStatus.ACTIVE
        )).thenReturn(Optional.empty());
        when(participationRepository.save(any(Participation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Participation result = service.startParticipation(olympiadId, student.getEmail());

        assertThat(result.getStatus()).isEqualTo(Participation.ParticipationStatus.ACTIVE);
        verify(participationRepository).save(any(Participation.class));
    }

    @Test
    void submitAnswerCreatesCorrectSingleChoiceAnswer() {
        Participation participation = participation("participation-1", student, olympiad);
        Question question = question("question-1", Question.QuestionType.SINGLE_CHOICE, "A", 5);
        when(participationRepository.findById(participation.getId())).thenReturn(Optional.of(participation));
        when(questionRepository.findById(question.getId())).thenReturn(Optional.of(question));
        when(answerRepository.findByParticipationIdAndQuestionId(participation.getId(), question.getId()))
                .thenReturn(Optional.empty());
        when(answerRepository.save(any(Answer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Answer result = service.submitAnswer(participation.getId(), question.getId(), "a", student.getEmail());

        assertThat(result.getAnswer()).isEqualTo("a");
        assertThat(result.getIsCorrect()).isTrue();
        assertThat(result.getPointsEarned()).isEqualTo(5);
        assertThat(result.getParticipation()).isEqualTo(participation);
    }

    @Test
    void submitAnswerUpdatesExistingMultipleChoiceAnswer() {
        Participation participation = participation("participation-1", student, olympiad);
        Question question = question("question-1", Question.QuestionType.MULTIPLE_CHOICE, "A,C", 7);
        Answer existing = Answer.builder()
                .id("answer-1")
                .participation(participation)
                .questionId(question.getId())
                .answer("B")
                .isCorrect(false)
                .pointsEarned(0)
                .submittedAt(LocalDateTime.now().minusMinutes(1))
                .build();
        when(participationRepository.findById(participation.getId())).thenReturn(Optional.of(participation));
        when(questionRepository.findById(question.getId())).thenReturn(Optional.of(question));
        when(answerRepository.findByParticipationIdAndQuestionId(participation.getId(), question.getId()))
                .thenReturn(Optional.of(existing));
        when(answerRepository.save(any(Answer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Answer result = service.submitAnswer(participation.getId(), question.getId(), "C|A", student.getEmail());

        assertThat(result).isSameAs(existing);
        assertThat(result.getIsCorrect()).isTrue();
        assertThat(result.getPointsEarned()).isEqualTo(7);
        assertThat(result.getAnswer()).isEqualTo("C|A");
    }

    @Test
    void submitAnswerUsesAttemptDurationEvenAfterOlympiadWindowEnds() {
        Participation participation = participation("participation-1", student, olympiad);
        participation.setStartedAt(LocalDateTime.now().minusMinutes(20));
        olympiad.setDurationMinutes(60);
        olympiad.setEndTime(LocalDateTime.now().minusMinutes(5));
        Question question = question("question-1", Question.QuestionType.TEXT, "answer", 3);
        when(participationRepository.findById(participation.getId())).thenReturn(Optional.of(participation));
        when(questionRepository.findById(question.getId())).thenReturn(Optional.of(question));
        when(answerRepository.findByParticipationIdAndQuestionId(participation.getId(), question.getId()))
                .thenReturn(Optional.empty());
        when(answerRepository.save(any(Answer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Answer result = service.submitAnswer(participation.getId(), question.getId(), "answer", student.getEmail());

        assertThat(result.getIsCorrect()).isTrue();
        verify(participationRepository, never()).save(participation);
    }

    @Test
    void submitAnswerRejectsQuestionFromAnotherOlympiad() {
        Participation participation = participation("participation-1", student, olympiad);
        Olympiad anotherOlympiad = olympiad(Olympiad.OlympiadStatus.PUBLISHED);
        anotherOlympiad.setId(UUID.randomUUID());
        Question question = Question.builder()
                .id("question-1")
                .type(Question.QuestionType.TEXT)
                .correctAnswer("42")
                .points(3)
                .olympiad(anotherOlympiad)
                .build();
        when(participationRepository.findById(participation.getId())).thenReturn(Optional.of(participation));
        when(questionRepository.findById(question.getId())).thenReturn(Optional.of(question));

        assertThatThrownBy(() -> service.submitAnswer(participation.getId(), question.getId(), "42", student.getEmail()))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void finishParticipationSumsAnswerScores() {
        Participation participation = participation("participation-1", student, olympiad);
        when(participationRepository.findById(participation.getId())).thenReturn(Optional.of(participation));
        when(answerRepository.findByParticipationId(participation.getId())).thenReturn(List.of(
                answer(4),
                answer(6)
        ));
        when(participationRepository.save(any(Participation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Participation result = service.finishParticipation(participation.getId(), student.getEmail());

        assertThat(result.getStatus()).isEqualTo(Participation.ParticipationStatus.FINISHED);
        assertThat(result.getFinishedAt()).isNotNull();
        assertThat(result.getScore()).isEqualTo(10);
    }

    @Test
    void getResultsAllowsOrganizerAndCalculatesMaxScore() {
        Participation participation = participation("participation-1", student, olympiad);
        olympiad.setQuestions(List.of(
                question("question-1", Question.QuestionType.TEXT, "one", 2),
                question("question-2", Question.QuestionType.TEXT, "two", 3)
        ));
        User organizer = user("organizer-1", "org@test.com", User.Role.ORGANIZER);
        participation.setScore(2);
        when(participationRepository.findById(participation.getId())).thenReturn(Optional.of(participation));
        when(userRepository.findByEmail(organizer.getEmail())).thenReturn(Optional.of(organizer));
        when(answerRepository.findByParticipationId(participation.getId())).thenReturn(List.of(answer(2)));

        ParticipationResponse result = service.getResults(participation.getId(), organizer.getEmail());

        assertThat(result.getParticipationId()).isEqualTo(participation.getId());
        assertThat(result.getTotalScore()).isEqualTo(2);
        assertThat(result.getMaxPossibleScore()).isEqualTo(5);
        assertThat(result.getAnswers()).hasSize(2);
        assertThat(result.getAnswers().getFirst().getCorrectAnswer()).isEqualTo("one");
        assertThat(result.getAnswers().getFirst().getMaxPoints()).isEqualTo(2);
    }

    @Test
    void submitAnswerFinishesAttemptWhenDeadlineExpired() {
        Participation participation = participation("participation-1", student, olympiad);
        participation.setStartedAt(LocalDateTime.now().minusMinutes(70));
        olympiad.setDurationMinutes(30);
        when(participationRepository.findById(participation.getId())).thenReturn(Optional.of(participation));

        assertThatThrownBy(() -> service.submitAnswer(participation.getId(), "question-1", "A", student.getEmail()))
                .isInstanceOf(BusinessException.class);

        ArgumentCaptor<Participation> captor = ArgumentCaptor.forClass(Participation.class);
        verify(participationRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(Participation.ParticipationStatus.FINISHED);
    }

    @Test
    void resultsAreHiddenFromStudentWhileAttemptIsActive() {
        Participation active = participation("p-active", student, olympiad);
        when(participationRepository.findById("p-active")).thenReturn(Optional.of(active));
        when(userRepository.findByEmail(student.getEmail())).thenReturn(Optional.of(student));

        assertThatThrownBy(() -> service.getResults("p-active", student.getEmail()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("после завершения");
    }

    @Test
    void resultsAreHiddenFromOrganizerOfAnotherOlympiad() {
        Participation finished = participation("p-1", student, olympiad);
        finished.setStatus(Participation.ParticipationStatus.FINISHED);
        User otherOrganizer = user("org-2", "other@test.com", User.Role.ORGANIZER);
        when(participationRepository.findById("p-1")).thenReturn(Optional.of(finished));
        when(userRepository.findByEmail(otherOrganizer.getEmail())).thenReturn(Optional.of(otherOrganizer));

        assertThatThrownBy(() -> service.getResults("p-1", otherOrganizer.getEmail()))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void submitAfterDeadlineFinishesAttemptWithCollectedScore() {
        Participation expired = participation("p-expired", student, olympiad);
        expired.setStartedAt(LocalDateTime.now().minusMinutes(olympiad.getDurationMinutes() + 5));
        when(participationRepository.findById("p-expired")).thenReturn(Optional.of(expired));
        when(answerRepository.findByParticipationId("p-expired")).thenReturn(List.of(answer(5), answer(3)));
        when(participationRepository.save(any(Participation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertThatThrownBy(() -> service.submitAnswer("p-expired", "q-1", "4", student.getEmail()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("истекло");

        assertThat(expired.getStatus()).isEqualTo(Participation.ParticipationStatus.FINISHED);
        assertThat(expired.getScore()).isEqualTo(8);
        assertThat(expired.getFinishedAt()).isEqualTo(expired.getStartedAt().plusMinutes(olympiad.getDurationMinutes()));
    }

    @Test
    void scheduledJobFinishesOnlyExpiredAttempts() {
        Participation running = participation("p-running", student, olympiad);
        Participation expired = participation("p-expired", student, olympiad);
        expired.setStartedAt(LocalDateTime.now().minusHours(2));
        when(participationRepository.findWithOlympiadByStatus(Participation.ParticipationStatus.ACTIVE))
                .thenReturn(List.of(running, expired));
        when(answerRepository.findByParticipationId("p-expired")).thenReturn(List.of(answer(10)));
        when(participationRepository.save(any(Participation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.finishExpiredAttempts();

        assertThat(running.getStatus()).isEqualTo(Participation.ParticipationStatus.ACTIVE);
        assertThat(expired.getStatus()).isEqualTo(Participation.ParticipationStatus.FINISHED);
        assertThat(expired.getScore()).isEqualTo(10);
    }

    @Test
    void savedAnswersAreReturnedOnlyToTheirAuthor() {
        Participation active = participation("p-1", student, olympiad);
        when(participationRepository.findById("p-1")).thenReturn(Optional.of(active));
        Answer saved = answer(0);
        saved.setQuestionId("q-1");
        saved.setAnswer("POST");
        when(answerRepository.findByParticipationId("p-1")).thenReturn(List.of(saved));

        assertThat(service.getSavedAnswers("p-1", student.getEmail()))
                .singleElement()
                .satisfies(item -> {
                    assertThat(item.questionId()).isEqualTo("q-1");
                    assertThat(item.answer()).isEqualTo("POST");
                });
        assertThatThrownBy(() -> service.getSavedAnswers("p-1", "intruder@test.com"))
                .isInstanceOf(BusinessException.class);
    }

    private Olympiad olympiad(Olympiad.OlympiadStatus status) {
        return Olympiad.builder()
                .id(olympiadId)
                .title("Programming Olympiad")
                .description("Description")
                .startTime(LocalDateTime.now().minusMinutes(10))
                .endTime(LocalDateTime.now().plusHours(1))
                .durationMinutes(60)
                .status(status)
                .createdBy("org@test.com")
                .questions(List.of())
                .build();
    }

    private Participation participation(String id, User user, Olympiad olympiad) {
        return Participation.builder()
                .id(id)
                .user(user)
                .olympiad(olympiad)
                .startedAt(LocalDateTime.now().minusMinutes(5))
                .status(Participation.ParticipationStatus.ACTIVE)
                .score(0)
                .build();
    }

    private Question question(String id, Question.QuestionType type, String correctAnswer, int points) {
        return Question.builder()
                .id(id)
                .text("Question")
                .type(type)
                .correctAnswer(correctAnswer)
                .points(points)
                .olympiad(olympiad)
                .build();
    }

    private Answer answer(int pointsEarned) {
        return Answer.builder()
                .pointsEarned(pointsEarned)
                .submittedAt(LocalDateTime.now())
                .build();
    }

    private User user(String id, String email, User.Role role) {
        return User.builder()
                .id(id)
                .email(email)
                .fullName(email)
                .role(role)
                .build();
    }
}
