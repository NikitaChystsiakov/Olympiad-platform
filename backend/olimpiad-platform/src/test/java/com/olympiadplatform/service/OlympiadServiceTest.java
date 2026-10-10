package com.olympiadplatform.service;

import com.olympiadplatform.dto.request.OlympiadCreateRequest;
import com.olympiadplatform.dto.request.OlympiadUpdateRequest;
import com.olympiadplatform.entity.Olympiad;
import com.olympiadplatform.entity.User;
import com.olympiadplatform.exception.BusinessException;
import com.olympiadplatform.repository.OlympiadRepository;
import com.olympiadplatform.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OlympiadServiceTest {

    @Mock
    private OlympiadRepository olympiadRepository;

    @Mock
    private UserRepository userRepository;

    private OlympiadService service;
    private UUID olympiadId;

    @BeforeEach
    void setUp() {
        service = new OlympiadService(olympiadRepository, userRepository);
        olympiadId = UUID.randomUUID();
    }

    @Test
    void createOlympiadSavesDraftCreatedByOrganizerEmail() {
        User organizer = User.builder()
                .id("organizer-1")
                .email("org@test.com")
                .role(User.Role.ORGANIZER)
                .build();
        OlympiadCreateRequest request = OlympiadCreateRequest.builder()
                .title("Programming Olympiad")
                .description("Description")
                .startTime(LocalDateTime.now().plusHours(1))
                .endTime(LocalDateTime.now().plusHours(2))
                .durationMinutes(60)
                .build();
        when(userRepository.findByEmail(organizer.getEmail())).thenReturn(Optional.of(organizer));
        when(olympiadRepository.save(org.mockito.ArgumentMatchers.any(Olympiad.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Olympiad result = service.createOlympiad(request, organizer.getEmail());

        assertThat(result.getStatus()).isEqualTo(Olympiad.OlympiadStatus.DRAFT);
        assertThat(result.getCreatedBy()).isEqualTo(organizer.getEmail());
        assertThat(result.getTitle()).isEqualTo(request.getTitle());
    }

    @Test
    void updateOlympiadAllowsPublishedOlympiad() {
        Olympiad olympiad = olympiad(Olympiad.OlympiadStatus.PUBLISHED);
        OlympiadUpdateRequest request = OlympiadUpdateRequest.builder()
                .title("Updated")
                .durationMinutes(90)
                .build();
        when(olympiadRepository.findById(olympiadId)).thenReturn(Optional.of(olympiad));
        when(olympiadRepository.save(olympiad)).thenReturn(olympiad);

        Olympiad result = service.updateOlympiad(olympiadId, request, "org@test.com");

        assertThat(result.getTitle()).isEqualTo("Updated");
        assertThat(result.getDurationMinutes()).isEqualTo(90);
    }

    @Test
    void updateOlympiadRejectsActiveOlympiad() {
        Olympiad olympiad = olympiad(Olympiad.OlympiadStatus.ACTIVE);
        when(olympiadRepository.findById(olympiadId)).thenReturn(Optional.of(olympiad));

        assertThatThrownBy(() -> service.updateOlympiad(olympiadId, OlympiadUpdateRequest.builder().title("Updated").build(), "org@test.com"))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void updateOlympiadRejectsForeignOrganizer() {
        Olympiad olympiad = olympiad(Olympiad.OlympiadStatus.DRAFT);
        when(olympiadRepository.findById(olympiadId)).thenReturn(Optional.of(olympiad));

        assertThatThrownBy(() -> service.updateOlympiad(olympiadId, OlympiadUpdateRequest.builder().title("Updated").build(), "other@test.com"))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void publishOlympiadMovesDraftToPublished() {
        Olympiad olympiad = olympiad(Olympiad.OlympiadStatus.DRAFT);
        when(olympiadRepository.findById(olympiadId)).thenReturn(Optional.of(olympiad));
        when(olympiadRepository.save(olympiad)).thenReturn(olympiad);

        Olympiad result = service.publishOlympiad(olympiadId, "org@test.com");

        assertThat(result.getStatus()).isEqualTo(Olympiad.OlympiadStatus.PUBLISHED);
    }

    @Test
    void publishOlympiadRejectsNonDraft() {
        Olympiad olympiad = olympiad(Olympiad.OlympiadStatus.PUBLISHED);
        when(olympiadRepository.findById(olympiadId)).thenReturn(Optional.of(olympiad));

        assertThatThrownBy(() -> service.publishOlympiad(olympiadId, "org@test.com"))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void getAllOlympiadsTrimsSearchAndHidesForeignDraftsFromNonAdmins() {
        PageRequest pageable = PageRequest.of(0, 20);
        Page<Olympiad> expected = new PageImpl<>(List.of(olympiad(Olympiad.OlympiadStatus.PUBLISHED)));
        when(olympiadRepository.findVisible(Olympiad.OlympiadStatus.PUBLISHED, "java", "student@test.com", false, pageable))
                .thenReturn(expected);

        Page<Olympiad> result = service.getAllOlympiads(Olympiad.OlympiadStatus.PUBLISHED, " java ", "student@test.com", pageable);

        assertThat(result).isSameAs(expected);
        verify(olympiadRepository).findVisible(Olympiad.OlympiadStatus.PUBLISHED, "java", "student@test.com", false, pageable);
    }

    @Test
    void publishOlympiadRejectsDraftWithoutQuestions() {
        Olympiad olympiad = olympiad(Olympiad.OlympiadStatus.DRAFT);
        olympiad.getQuestions().clear();
        when(olympiadRepository.findById(olympiadId)).thenReturn(Optional.of(olympiad));

        assertThatThrownBy(() -> service.publishOlympiad(olympiadId, "org@test.com"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("хотя бы один вопрос");
    }

    private Olympiad olympiad(Olympiad.OlympiadStatus status) {
        return Olympiad.builder()
                .id(olympiadId)
                .title("Programming Olympiad")
                .description("Description")
                .startTime(LocalDateTime.now().plusHours(1))
                .endTime(LocalDateTime.now().plusHours(2))
                .durationMinutes(60)
                .status(status)
                .createdBy("org@test.com")
                .questions(new java.util.ArrayList<>(List.of(com.olympiadplatform.entity.Question.builder()
                        .text("2 + 2?")
                        .type(com.olympiadplatform.entity.Question.QuestionType.TEXT)
                        .correctAnswer("4")
                        .points(1)
                        .build())))
                .build();
    }
}
