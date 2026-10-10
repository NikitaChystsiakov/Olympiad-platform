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

    /**
     * Drafts are visible only to their author, unless {@code includeAllDrafts} is set (admins).
     * An empty {@code search} matches everything.
     */
    @Query("SELECT o FROM Olympiad o WHERE " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(LOWER(o.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(o.description) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:includeAllDrafts = TRUE OR o.status <> com.olympiadplatform.entity.Olympiad.OlympiadStatus.DRAFT OR o.createdBy = :viewer) " +
           "ORDER BY o.startTime DESC")
    Page<Olympiad> findVisible(
            @Param("status") Olympiad.OlympiadStatus status,
            @Param("search") String search,
            @Param("viewer") String viewerEmail,
            @Param("includeAllDrafts") boolean includeAllDrafts,
            Pageable pageable
    );
}
