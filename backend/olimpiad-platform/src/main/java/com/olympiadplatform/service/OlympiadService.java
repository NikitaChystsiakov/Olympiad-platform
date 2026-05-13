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
    public Page<Olympiad> getAllOlympiads(Olympiad.OlympiadStatus status, String search, @NonNull Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            return olympiadRepository.findByStatusAndSearch(status, search.trim(), pageable);
        }
        if (status != null) {
            return olympiadRepository.findByStatus(status, pageable);
        }
        return olympiadRepository.findAll(pageable);
    }

    @NonNull
    public Olympiad getOlympiadById(@NonNull UUID id) {
        return olympiadRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Олимпиада не найдена"));
    }

    @NonNull
    @Transactional
    public Olympiad createOlympiad(@NonNull OlympiadCreateRequest request, @NonNull String userEmail) {
        User creator = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BusinessException("Пользователь не найден"));

        Olympiad olympiad = Olympiad.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .durationMinutes(request.getDurationMinutes())
                .status(Olympiad.OlympiadStatus.DRAFT)
                .createdBy(creator.getEmail()) // Сохраняем email создателя
                .build();

        return olympiadRepository.save(olympiad);
    }

    @NonNull
    @Transactional
    public Olympiad updateOlympiad(@NonNull UUID id, @NonNull OlympiadUpdateRequest request, @NonNull String userEmail) {
        Olympiad olympiad = olympiadRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Олимпиада не найдена"));

        if (!olympiad.getCreatedBy().equals(userEmail)) {
            throw new BusinessException("Недостаточно прав для редактирования");
        }

        if (olympiad.getStatus() == Olympiad.OlympiadStatus.ACTIVE ||
            olympiad.getStatus() == Olympiad.OlympiadStatus.FINISHED) {
            throw new BusinessException("Нельзя редактировать активную или завершенную олимпиаду");
        }

        if (request.getTitle() != null) olympiad.setTitle(request.getTitle());
        if (request.getDescription() != null) olympiad.setDescription(request.getDescription());
        if (request.getStartTime() != null) olympiad.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) olympiad.setEndTime(request.getEndTime());
        if (request.getDurationMinutes() != null) olympiad.setDurationMinutes(request.getDurationMinutes());

        return olympiadRepository.save(olympiad);
    }

    @NonNull
    @Transactional
    public Olympiad publishOlympiad(@NonNull UUID id, @NonNull String userEmail) {
        Olympiad olympiad = olympiadRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Олимпиада не найдена"));

        if (!olympiad.getCreatedBy().equals(userEmail)) {
            throw new BusinessException("Недостаточно прав для публикации");
        }

        if (olympiad.getStatus() != Olympiad.OlympiadStatus.DRAFT) {
            throw new BusinessException("Можно опубликовать только черновик");
        }

        olympiad.setStatus(Olympiad.OlympiadStatus.PUBLISHED);
        return olympiadRepository.save(olympiad);
    }

    @Transactional
    public void deleteOlympiad(@NonNull UUID id) {
        Olympiad olympiad = olympiadRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Олимпиада не найдена"));
        olympiadRepository.delete(olympiad);
    }
}
