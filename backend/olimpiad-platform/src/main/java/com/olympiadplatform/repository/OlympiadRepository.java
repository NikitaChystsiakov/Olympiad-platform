package com.olympiadplatform.repository;

import com.olympiadplatform.entity.Olympiad;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OlympiadRepository extends JpaRepository<Olympiad, UUID> {
    
    @Query("SELECT o FROM Olympiad o WHERE " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:search IS NULL OR LOWER(o.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(o.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Olympiad> findByStatusAndSearch(
            @Param("status") Olympiad.OlympiadStatus status,
            @Param("search") String search,
            Pageable pageable
    );
    
    Page<Olympiad> findByStatus(Olympiad.OlympiadStatus status, Pageable pageable);
    
    Page<Olympiad> findByCreatedBy(String userEmail, Pageable pageable);
}