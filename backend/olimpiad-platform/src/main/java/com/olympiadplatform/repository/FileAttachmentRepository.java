package com.olympiadplatform.repository;

import com.olympiadplatform.entity.FileAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileAttachmentRepository extends JpaRepository<FileAttachment, String> {
    List<FileAttachment> findByAnswerId(String answerId);
    Optional<FileAttachment> findByFileName(String fileName);
}
