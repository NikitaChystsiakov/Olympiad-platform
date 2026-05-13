package com.olympiadplatform.service;

import com.olympiadplatform.dto.request.QuestionCreateRequest;
import com.olympiadplatform.entity.Olympiad;
import com.olympiadplatform.entity.Question;
import com.olympiadplatform.exception.BusinessException;
import com.olympiadplatform.repository.OlympiadRepository;
import com.olympiadplatform.repository.QuestionRepository;
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

    @NonNull
    public List<Question> getQuestionsByOlympiadId(@NonNull UUID olympiadId) {
        return questionRepository.findByOlympiadId(olympiadId);
    }

    @NonNull
    @Transactional
    public Question addQuestion(@NonNull UUID olympiadId, @NonNull QuestionCreateRequest request,
                                @NonNull String userEmail) {
        Olympiad olympiad = olympiadRepository.findById(olympiadId)
                .orElseThrow(() -> new BusinessException("Олимпиада не найдена"));

        if (!olympiad.getCreatedBy().equals(userEmail)) {
            throw new BusinessException("Недостаточно прав для добавления вопросов");
        }

        if (!canEditQuestions(olympiad)) {
            throw new BusinessException("Можно добавлять вопросы только в черновик олимпиады");
        }

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
        Olympiad olympiad = olympiadRepository.findById(olympiadId)
                .orElseThrow(() -> new BusinessException("Олимпиада не найдена"));

        if (!olympiad.getCreatedBy().equals(userEmail)) {
            throw new BusinessException("Недостаточно прав для редактирования вопросов");
        }

        if (!canEditQuestions(olympiad)) {
            throw new BusinessException("Можно редактировать вопросы только в черновике олимпиады");
        }

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new BusinessException("Вопрос не найден"));

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
        Olympiad olympiad = olympiadRepository.findById(olympiadId)
                .orElseThrow(() -> new BusinessException("Олимпиада не найдена"));

        if (!olympiad.getCreatedBy().equals(userEmail)) {
            throw new BusinessException("Недостаточно прав для удаления вопросов");
        }

        if (!canEditQuestions(olympiad)) {
            throw new BusinessException("Можно удалять вопросы только из черновика олимпиады");
        }

        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new BusinessException("Вопрос не найден"));

        questionRepository.delete(question);
    }

    private boolean canEditQuestions(@NonNull Olympiad olympiad) {
        return olympiad.getStatus() == Olympiad.OlympiadStatus.DRAFT ||
               olympiad.getStatus() == Olympiad.OlympiadStatus.PUBLISHED;
    }
}
