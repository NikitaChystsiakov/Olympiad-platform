package com.olympiadplatform.service;

import com.olympiadplatform.dto.request.QuestionCreateRequest;
import com.olympiadplatform.entity.Olympiad;
import com.olympiadplatform.entity.Question;
import com.olympiadplatform.exception.BusinessException;
import com.olympiadplatform.repository.OlympiadRepository;
import com.olympiadplatform.repository.QuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuestionServiceTest {

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private OlympiadRepository olympiadRepository;

    private QuestionService service;
    private UUID olympiadId;

    @BeforeEach
    void setUp() {
        service = new QuestionService(questionRepository, olympiadRepository);
        olympiadId = UUID.randomUUID();
    }

    @Test
    void addQuestionAllowsPublishedOlympiad() {
        Olympiad olympiad = olympiad(Olympiad.OlympiadStatus.PUBLISHED);
        QuestionCreateRequest request = request("TEXT", null, "answer", 3);
        when(olympiadRepository.findById(olympiadId)).thenReturn(Optional.of(olympiad));
        when(questionRepository.save(org.mockito.ArgumentMatchers.any(Question.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Question result = service.addQuestion(olympiadId, request, "org@test.com");

        assertThat(result.getOlympiad()).isEqualTo(olympiad);
        assertThat(result.getType()).isEqualTo(Question.QuestionType.TEXT);
        assertThat(result.getCorrectAnswer()).isEqualTo("answer");
        assertThat(result.getPoints()).isEqualTo(3);
    }

    @Test
    void addQuestionRejectsActiveOlympiad() {
        when(olympiadRepository.findById(olympiadId)).thenReturn(Optional.of(olympiad(Olympiad.OlympiadStatus.ACTIVE)));

        assertThatThrownBy(() -> service.addQuestion(olympiadId, request("TEXT", null, "answer", 3), "org@test.com"))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void addQuestionRejectsForeignOrganizer() {
        when(olympiadRepository.findById(olympiadId)).thenReturn(Optional.of(olympiad(Olympiad.OlympiadStatus.DRAFT)));

        assertThatThrownBy(() -> service.addQuestion(olympiadId, request("TEXT", null, "answer", 3), "other@test.com"))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void updateQuestionChangesAllEditableFields() {
        Olympiad olympiad = olympiad(Olympiad.OlympiadStatus.DRAFT);
        Question question = Question.builder()
                .id("question-1")
                .text("Old")
                .type(Question.QuestionType.TEXT)
                .points(1)
                .olympiad(olympiad)
                .build();
        QuestionCreateRequest request = request("SINGLE_CHOICE", "[\"A\",\"B\"]", "A", 5);
        when(olympiadRepository.findById(olympiadId)).thenReturn(Optional.of(olympiad));
        when(questionRepository.findById(question.getId())).thenReturn(Optional.of(question));
        when(questionRepository.save(question)).thenReturn(question);

        Question result = service.updateQuestion(olympiadId, question.getId(), request, "org@test.com");

        assertThat(result.getText()).isEqualTo("Question text");
        assertThat(result.getType()).isEqualTo(Question.QuestionType.SINGLE_CHOICE);
        assertThat(result.getOptions()).isEqualTo("[\"A\",\"B\"]");
        assertThat(result.getCorrectAnswer()).isEqualTo("A");
        assertThat(result.getPoints()).isEqualTo(5);
    }

    @Test
    void deleteQuestionDeletesWhenOrganizerOwnsDraft() {
        Olympiad olympiad = olympiad(Olympiad.OlympiadStatus.DRAFT);
        Question question = Question.builder().id("question-1").olympiad(olympiad).build();
        when(olympiadRepository.findById(olympiadId)).thenReturn(Optional.of(olympiad));
        when(questionRepository.findById(question.getId())).thenReturn(Optional.of(question));

        service.deleteQuestion(olympiadId, question.getId(), "org@test.com");

        verify(questionRepository).delete(question);
    }

    @Test
    void deleteQuestionRejectsFinishedOlympiad() {
        when(olympiadRepository.findById(olympiadId)).thenReturn(Optional.of(olympiad(Olympiad.OlympiadStatus.FINISHED)));

        assertThatThrownBy(() -> service.deleteQuestion(olympiadId, "question-1", "org@test.com"))
                .isInstanceOf(BusinessException.class);
    }

    private QuestionCreateRequest request(String type, String options, String correctAnswer, int points) {
        QuestionCreateRequest request = new QuestionCreateRequest();
        request.setText("Question text");
        request.setType(type);
        request.setOptions(options);
        request.setCorrectAnswer(correctAnswer);
        request.setPoints(points);
        return request;
    }

    private Olympiad olympiad(Olympiad.OlympiadStatus status) {
        return Olympiad.builder()
                .id(olympiadId)
                .title("Programming Olympiad")
                .description("Description")
                .startTime(LocalDateTime.now())
                .endTime(LocalDateTime.now().plusHours(1))
                .durationMinutes(60)
                .status(status)
                .createdBy("org@test.com")
                .build();
    }
}
