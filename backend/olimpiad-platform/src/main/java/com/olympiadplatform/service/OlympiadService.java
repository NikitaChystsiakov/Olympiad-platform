package com.olympiadplatform.service;

import com.olympiadplatform.dto.request.OlympiadCreateRequest;
import com.olympiadplatform.dto.request.OlympiadUpdateRequest;
import com.olympiadplatform.entity.Olympiad;
import com.olympiadplatform.entity.User;
import com.olympiadplatform.exception.BusinessException;
import com.olympiadplatform.repository.OlympiadRepository;
import com.olympiadplatform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OlympiadService {

    private final OlympiadRepository olympiadRepository;
    private final UserRepository userRepository;

    @NonNull
    @Transactional(readOnly = true)
    public Page<Olympiad> getAllOlympiads(Olympiad.OlympiadStatus status, String search,
                                          @NonNull String viewerEmail, @NonNull Pageable pageable) {
        String normalizedSearch = search == null ? "" : search.trim();
        return olympiadRepository.findVisible(status, normalizedSearch, viewerEmail, isAdmin(viewerEmail), pageable);
    }

    @NonNull
    @Transactional(readOnly = true)
    public Olympiad getOlympiadById(@NonNull UUID id, @NonNull String viewerEmail) {
        Olympiad olympiad = findOlympiad(id);
        if (olympiad.getStatus() == Olympiad.OlympiadStatus.DRAFT && !canManage(olympiad, viewerEmail)) {
            throw BusinessException.notFound("Олимпиада не найдена");
        }
        return olympiad;
    }

    @NonNull
    @Transactional
    public Olympiad createOlympiad(@NonNull OlympiadCreateRequest request, @NonNull String userEmail) {
        User creator = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> BusinessException.notFound("Пользователь не найден"));

        Olympiad olympiad = Olympiad.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .durationMinutes(request.getDurationMinutes())
                .status(Olympiad.OlympiadStatus.DRAFT)
                .createdBy(creator.getEmail())
                .build();

        return olympiadRepository.save(olympiad);
    }

    @NonNull
    @Transactional
    public Olympiad updateOlympiad(@NonNull UUID id, @NonNull OlympiadUpdateRequest request, @NonNull String userEmail) {
        Olympiad olympiad = findOlympiad(id);

        if (!canManage(olympiad, userEmail)) {
            throw BusinessException.forbidden("Недостаточно прав для редактирования");
        }

        if (olympiad.getStatus() == Olympiad.OlympiadStatus.ACTIVE ||
            olympiad.getStatus() == Olympiad.OlympiadStatus.FINISHED) {
            throw new BusinessException("Нельзя редактировать активную или завершенную олимпиаду");
        }

        if (request.getTitle() != null) olympiad.setTitle(request.getTitle().trim());
        if (request.getDescription() != null) olympiad.setDescription(request.getDescription());
        if (request.getStartTime() != null) olympiad.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) olympiad.setEndTime(request.getEndTime());
        if (request.getDurationMinutes() != null) olympiad.setDurationMinutes(request.getDurationMinutes());

        if (!olympiad.getEndTime().isAfter(olympiad.getStartTime())) {
            throw new BusinessException("Дата окончания должна быть позже даты начала");
        }

        return olympiadRepository.save(olympiad);
    }

    @NonNull
    @Transactional
    public Olympiad publishOlympiad(@NonNull UUID id, @NonNull String userEmail) {
        Olympiad olympiad = findOlympiad(id);

        if (!canManage(olympiad, userEmail)) {
            throw BusinessException.forbidden("Недостаточно прав для публикации");
        }

        if (olympiad.getStatus() != Olympiad.OlympiadStatus.DRAFT) {
            throw new BusinessException("Можно опубликовать только черновик");
        }

        if (olympiad.getQuestions().isEmpty()) {
            throw new BusinessException("Добавьте хотя бы один вопрос перед публикацией");
        }

        olympiad.setStatus(Olympiad.OlympiadStatus.PUBLISHED);
        return olympiadRepository.save(olympiad);
    }

    @Transactional
    public void deleteOlympiad(@NonNull UUID id) {
        olympiadRepository.delete(findOlympiad(id));
    }

    /** The author or any admin may manage an olympiad. */
    public boolean canManage(@NonNull Olympiad olympiad, @NonNull String userEmail) {
        return olympiad.getCreatedBy().equals(userEmail) || isAdmin(userEmail);
    }

    private boolean isAdmin(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .map(user -> user.getRole() == User.Role.ADMIN)
                .orElse(false);
    }

    private Olympiad findOlympiad(UUID id) {
        return olympiadRepository.findById(id)
                .orElseThrow(() -> BusinessException.notFound("Олимпиада не найдена"));
    }
}
