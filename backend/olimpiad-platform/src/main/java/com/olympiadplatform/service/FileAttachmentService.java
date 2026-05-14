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
                .orElseThrow(() -> new BusinessException("Участие не найдено"));

        if (!participation.getUser().getEmail().equals(userEmail)) {
            throw new BusinessException("Доступ запрещён");
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
                .orElseThrow(() -> new BusinessException("Участие не найдено"));

        if (participation.getStatus() != Participation.ParticipationStatus.ACTIVE) {
            throw new BusinessException("Участие неактивно");
        }

        if (!participation.getUser().getEmail().equals(userEmail)) {
            throw new BusinessException("Доступ запрещён");
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

        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
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
                .originalName(originalName != null ? originalName : "file")
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
                .orElseThrow(() -> new BusinessException("Файл не найден"));

        Answer answer = attachment.getAnswer();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BusinessException("Пользователь не найден"));

        boolean isOwner = answer.getParticipation().getUser().getId().equals(user.getId());
        boolean isPrivileged = user.getRole() == User.Role.ORGANIZER || user.getRole() == User.Role.ADMIN;

        if (!isOwner && !isPrivileged) {
            throw new BusinessException("Нет прав на удаление файла");
        }

        try {
            Path filePath = Paths.get(uploadDir).resolve(attachment.getFileName());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.error("Ошибка при удалении файла с диска: {}", attachment.getFileName(), e);
        }

        fileAttachmentRepository.delete(attachment);
    }

    public String getOriginalFileName(@NonNull String storedFileName) {
        return fileAttachmentRepository.findByFileName(storedFileName)
                .map(FileAttachment::getOriginalName)
                .orElse(storedFileName);
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
