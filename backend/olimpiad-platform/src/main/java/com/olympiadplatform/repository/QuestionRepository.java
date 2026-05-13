package com.olympiadplatform.repository;

import com.olympiadplatform.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, String> {
    List<Question> findByOlympiadId(UUID olympiadId);
}