package com.olympiadplatform.service;

import com.olympiadplatform.dto.request.QuestionCreateRequest;
import com.olympiadplatform.entity.Olympiad;
import com.olympiadplatform.entity.Participation;
import com.olympiadplatform.entity.Question;
import com.olympiadplatform.entity.User;
import com.olympiadplatform.exception.BusinessException;
import com.olympiadplatform.repository.OlympiadRepository;
import com.olympiadplatform.repository.ParticipationRepository;
import com.olympiadplatform.repository.QuestionRepository;
import com.olympiadplatform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final OlympiadRepository olympiadRepository;
    private final UserRepository userRepository;
    private final ParticipationRepository participationRepository;

    /**
     * Managers see every question. Students see them only during their own active attempt,
     * so the task list can't be read before the start.
     */
    @NonNull
    @Transactional(readOnly = true)
    public List<Question> getQuestionsByOlympiadId(@NonNull UUID olympiadId, @NonNull String userEmail) {
        Olympiad olympiad = findOlympiad(olympiadId);
        if (!canManage(olympiad, userEmail) && !participationRepository.existsByUserEmailAndOlympiadIdAndStatus(
                userEmail, olympiadId, Participation.ParticipationStatus.ACTIVE)) {
            throw BusinessException.forbidden("Вопросы доступны только во время попытки");
        }
        return questionRepository.findByOlympiadId(olympiadId);
    }

    public boolean canManage(@NonNull Olympiad olympiad, @NonNull String userEmail) {
        if (olympiad.getCreatedBy().equals(userEmail)) {
            return true;
        }
        return userRepository.findByEmail(userEmail)
                .map(user -> user.getRole() == User.Role.ADMIN)
                .orElse(false);
    }

    @NonNull
    @Transactional
    public Question addQuestion(@NonNull UUID olympiadId, @NonNull QuestionCreateRequest request,
                                @NonNull String userEmail) {
        Olympiad olympiad = findEditableOlympiad(olympiadId, userEmail);

        Question question = Question.builder()
                .text(request.getText())
                .type(Question.QuestionType.valueOf(request.getType().toUpperCase()))
                .options(request.getOptions())
                .correctAnswer(request.getCorrectAnswer())
                .points(request.getPoints())
                .olympiad(olympiad)
                .build();

        return questionRepository.save(question);
    }

    @NonNull
    @Transactional
    public Question updateQuestion(@NonNull UUID olympiadId, @NonNull String questionId,
                                   @NonNull QuestionCreateRequest request, @NonNull String userEmail) {
        findEditableOlympiad(olympiadId, userEmail);
        Question question = findQuestionOf(olympiadId, questionId);

        question.setText(request.getText());
        question.setType(Question.QuestionType.valueOf(request.getType().toUpperCase()));
        question.setOptions(request.getOptions());
        question.setCorrectAnswer(request.getCorrectAnswer());
        question.setPoints(request.getPoints());

        return questionRepository.save(question);
    }

    @Transactional
    public void deleteQuestion(@NonNull UUID olympiadId, @NonNull String questionId,
                               @NonNull String userEmail) {
        findEditableOlympiad(olympiadId, userEmail);
        questionRepository.delete(findQuestionOf(olympiadId, questionId));
    }

    private Olympiad findEditableOlympiad(UUID olympiadId, String userEmail) {
        Olympiad olympiad = findOlympiad(olympiadId);
        if (!canManage(olympiad, userEmail)) {
            throw BusinessException.forbidden("Недостаточно прав для изменения вопросов");
        }
        if (olympiad.getStatus() != Olympiad.OlympiadStatus.DRAFT &&
            olympiad.getStatus() != Olympiad.OlympiadStatus.PUBLISHED) {
            throw new BusinessException("Вопросы можно менять только в черновике или опубликованной олимпиаде");
        }
        return olympiad;
    }

    private Question findQuestionOf(UUID olympiadId, String questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> BusinessException.notFound("Вопрос не найден"));
        // Guards against editing another organizer's question through your own olympiad id.
        if (!question.getOlympiad().getId().equals(olympiadId)) {
            throw BusinessException.notFound("Вопрос не найден");
        }
        return question;
    }

    private Olympiad findOlympiad(UUID olympiadId) {
        return olympiadRepository.findById(olympiadId)
                .orElseThrow(() -> BusinessException.notFound("Олимпиада не найдена"));
    }
}
