package com.olympiadplatform.service;

import com.olympiadplatform.dto.response.FileAttachmentResponse;
import com.olympiadplatform.entity.*;
import com.olympiadplatform.exception.BusinessException;
import com.olympiadplatform.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileAttachmentService {

    private final FileAttachmentRepository fileAttachmentRepository;
    private final AnswerRepository answerRepository;
    private final ParticipationRepository participationRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Value("#{'${app.upload.allowed-types:image/jpeg,image/png,application/pdf}'.split(',')}")
    private List<String> allowedTypes;

    @Value("${app.upload.max-size:10485760}")
    private long maxSize;

    @NonNull
    @Transactional(readOnly = true)
    public List<FileAttachmentResponse> getAttachments(@NonNull String participationId,
                                                       @NonNull String questionId,
                                                       @NonNull String userEmail) {
        Participation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> BusinessException.notFound("Участие не найдено"));

        if (!participation.getUser().getEmail().equals(userEmail)) {
            throw BusinessException.forbidden("Доступ запрещён");
        }

        var answer = answerRepository.findByParticipationIdAndQuestionId(participationId, questionId);
        if (answer.isEmpty()) return List.of();

        return fileAttachmentRepository.findByAnswerId(answer.get().getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @NonNull
    public FileAttachmentResponse uploadFile(@NonNull String participationId,
                                             @NonNull String questionId,
                                             @NonNull String userEmail,
                                             @NonNull MultipartFile file) throws IOException {
        Participation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> BusinessException.notFound("Участие не найдено"));

        if (!participation.getUser().getEmail().equals(userEmail)) {
            throw BusinessException.forbidden("Доступ запрещён");
        }

        if (participation.getStatus() != Participation.ParticipationStatus.ACTIVE) {
            throw new BusinessException("Участие неактивно");
        }

        var question = questionRepository.findById(questionId)
                .orElseThrow(() -> BusinessException.notFound("Вопрос не найден"));
        if (!question.getOlympiad().getId().equals(participation.getOlympiad().getId())) {
            throw new BusinessException("Вопрос не относится к этой олимпиаде");
        }
        if (question.getType() != com.olympiadplatform.entity.Question.QuestionType.MANUAL_REVIEW) {
            throw new BusinessException("К этому вопросу нельзя прикрепить файл");
        }

        validateFile(file);

        var existingAnswer = answerRepository.findByParticipationIdAndQuestionId(participationId, questionId);
        Answer answer = existingAnswer.orElseGet(() -> {
            Answer newAnswer = Answer.builder()
                    .participation(participation)
                    .questionId(questionId)
                    .answer("")
                    .submittedAt(LocalDateTime.now())
                    .build();
            return answerRepository.save(newAnswer);
        });

        String originalName = sanitizeFileName(file.getOriginalFilename());
        String extension = "";
        int dot = originalName.lastIndexOf('.');
        if (dot >= 0 && originalName.length() - dot <= 10) {
            extension = originalName.substring(dot).toLowerCase();
        }
        String storedName = UUID.randomUUID() + extension;
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        Path filePath = uploadPath.resolve(storedName);
        file.transferTo(filePath);
        log.info("Файл сохранён: путь={}, размер на диске={}", filePath, Files.size(filePath));

        FileAttachment attachment = FileAttachment.builder()
                .answer(answer)
                .fileName(storedName)
                .originalName(originalName)
                .mimeType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .size(file.getSize())
                .url("/api/files/" + storedName)
                .build();

        attachment = fileAttachmentRepository.save(attachment);
        return toResponse(attachment);
    }

    @Transactional
    public void deleteAttachment(@NonNull String attachmentId, @NonNull String userEmail) {
        FileAttachment attachment = fileAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> BusinessException.notFound("Файл не найден"));

        Answer answer = attachment.getAnswer();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> BusinessException.notFound("Пользователь не найден"));

        Participation participation = answer.getParticipation();
        boolean isOwner = participation.getUser().getId().equals(user.getId())
                && participation.getStatus() == Participation.ParticipationStatus.ACTIVE;

        if (!isOwner && !canManageOlympiad(participation, user)) {
            throw BusinessException.forbidden("Нет прав на удаление файла");
        }

        try {
            Path filePath = resolveStoredFile(attachment.getFileName());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.error("Ошибка при удалении файла с диска: {}", attachment.getFileName(), e);
        }

        fileAttachmentRepository.delete(attachment);
    }

    /** Returns the stored file if the user is its author, the olympiad's organizer or an admin. */
    @NonNull
    @Transactional(readOnly = true)
    public StoredFile loadForDownload(@NonNull String storedFileName, @NonNull String userEmail) {
        FileAttachment attachment = fileAttachmentRepository.findByFileName(storedFileName)
                .orElseThrow(() -> BusinessException.notFound("Файл не найден"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> BusinessException.notFound("Пользователь не найден"));
        Participation participation = attachment.getAnswer().getParticipation();

        boolean isOwner = participation.getUser().getId().equals(user.getId());
        if (!isOwner && !canManageOlympiad(participation, user)) {
            throw BusinessException.forbidden("Доступ запрещён");
        }

        Path path = resolveStoredFile(storedFileName);
        if (!Files.isRegularFile(path)) {
            throw BusinessException.notFound("Файл не найден");
        }
        return new StoredFile(path, attachment.getOriginalName(), attachment.getMimeType());
    }

    public record StoredFile(Path path, String originalName, String mimeType) {}

    private boolean canManageOlympiad(Participation participation, User user) {
        return user.getRole() == User.Role.ADMIN
                || (user.getRole() == User.Role.ORGANIZER
                    && participation.getOlympiad().getCreatedBy().equals(user.getEmail()));
    }

    private Path resolveStoredFile(String storedFileName) {
        Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path path = root.resolve(storedFileName).normalize();
        if (!path.startsWith(root)) {
            throw BusinessException.notFound("Файл не найден");
        }
        return path;
    }

    private String sanitizeFileName(String name) {
        if (name == null || name.isBlank()) {
            return "file";
        }
        String base = name.substring(Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\')) + 1);
        String cleaned = base.replaceAll("[\\r\\n\"\\\\/]", "_");
        return cleaned.length() > 200 ? cleaned.substring(cleaned.length() - 200) : cleaned;
    }

    private FileAttachmentResponse toResponse(FileAttachment a) {
        return new FileAttachmentResponse(
                a.getId(),
                a.getOriginalName(),
                a.getMimeType(),
                a.getSize(),
                a.getUrl(),
                a.getCreatedAt()
        );
    }

    private void validateFile(MultipartFile file) {
        if (file.getSize() > maxSize) {
            throw new BusinessException("Размер файла превышает " + maxSize + " байт");
        }
        String contentType = file.getContentType();
        if (contentType == null || allowedTypes.stream().noneMatch(t -> t.equalsIgnoreCase(contentType))) {
            throw new BusinessException("Недопустимый тип файла: " + contentType);
        }
    }
}
