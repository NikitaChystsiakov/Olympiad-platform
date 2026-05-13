package com.olympiadplatform.repository;

import com.olympiadplatform.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, String> {
    List<Answer> findByParticipationId(String participationId);
    Optional<Answer> findByParticipationIdAndQuestionId(String participationId, String questionId);

    @Query("SELECT a FROM Answer a JOIN FETCH a.participation p JOIN FETCH p.user JOIN FETCH p.olympiad WHERE p.olympiad.id = :olympiadId")
    List<Answer> findWithParticipationByOlympiadId(@Param("olympiadId") java.util.UUID olympiadId);
}
