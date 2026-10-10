package com.olympiadplatform.repository;

import com.olympiadplatform.entity.Participation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.olympiadplatform.entity.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParticipationRepository extends JpaRepository<Participation, String> {
    
    @Query("SELECT p FROM Participation p WHERE p.user.id = :userId AND p.olympiad.id = :olympiadId")
    Optional<Participation> findByUserIdAndOlympiadId(@Param("userId") String userId, @Param("olympiadId") java.util.UUID olympiadId);

    @Query("SELECT p FROM Participation p WHERE p.user.id = :userId AND p.olympiad.id = :olympiadId AND p.status = :status ORDER BY p.startedAt DESC LIMIT 1")
    Optional<Participation> findActiveByUserIdAndOlympiadId(
            @Param("userId") String userId,
            @Param("olympiadId") java.util.UUID olympiadId,
            @Param("status") Participation.ParticipationStatus status
    );
    
    List<Participation> findByUserId(String userId);

    @Query("SELECT p FROM Participation p JOIN FETCH p.olympiad WHERE p.user.email = :email ORDER BY p.startedAt DESC")
    List<Participation> findWithOlympiadByUserEmail(@Param("email") String email);

    @Query("SELECT p FROM Participation p JOIN FETCH p.olympiad WHERE p.status = :status")
    List<Participation> findWithOlympiadByStatus(@Param("status") Participation.ParticipationStatus status);

    @Query("SELECT COUNT(p) > 0 FROM Participation p WHERE p.user.email = :email AND p.olympiad.id = :olympiadId AND p.status = :status")
    boolean existsByUserEmailAndOlympiadIdAndStatus(
            @Param("email") String email,
            @Param("olympiadId") java.util.UUID olympiadId,
            @Param("status") Participation.ParticipationStatus status
    );
    
    List<Participation> findByOlympiadId(java.util.UUID olympiadId);

    @Query("SELECT p FROM Participation p JOIN FETCH p.user JOIN FETCH p.olympiad WHERE p.olympiad.id = :olympiadId")
    List<Participation> findWithUserAndOlympiadByOlympiadId(@Param("olympiadId") java.util.UUID olympiadId);
}
