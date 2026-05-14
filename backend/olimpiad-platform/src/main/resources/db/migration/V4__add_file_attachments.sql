CREATE TABLE file_attachments (
    id VARCHAR(255) PRIMARY KEY,
    answer_id VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_file_attachments_answer FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE
);
