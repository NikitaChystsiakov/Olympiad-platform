CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL CHECK (role IN ('STUDENT', 'ORGANIZER', 'ADMIN')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    oauth_provider VARCHAR(255),
    oauth_id VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    version BIGINT
);

CREATE TABLE olympiads (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status VARCHAR(255) NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED', 'ACTIVE', 'FINISHED', 'CANCELLED')),
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE questions (
    id VARCHAR(255) PRIMARY KEY,
    text VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL CHECK (type IN ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT', 'CODE')),
    options TEXT,
    correct_answer TEXT,
    points INTEGER NOT NULL,
    olympiad_id UUID NOT NULL,
    CONSTRAINT fk_questions_olympiad FOREIGN KEY (olympiad_id) REFERENCES olympiads(id) ON DELETE CASCADE
);

CREATE TABLE participations (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    olympiad_id UUID NOT NULL,
    started_at TIMESTAMP NOT NULL,
    finished_at TIMESTAMP,
    score INTEGER,
    status VARCHAR(255) CHECK (status IN ('ACTIVE', 'PAUSED', 'FINISHED', 'DISQUALIFIED')),
    CONSTRAINT fk_participations_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_participations_olympiad FOREIGN KEY (olympiad_id) REFERENCES olympiads(id)
);

CREATE TABLE answers (
    id VARCHAR(255) PRIMARY KEY,
    participation_id VARCHAR(255) NOT NULL,
    question_id VARCHAR(255) NOT NULL,
    answer TEXT,
    is_correct BOOLEAN,
    points_earned INTEGER,
    submitted_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_answers_participation FOREIGN KEY (participation_id) REFERENCES participations(id) ON DELETE CASCADE
);

CREATE TABLE proctoring_events (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    olympiad_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    event_type VARCHAR(255) NOT NULL CHECK (
        event_type IN ('TAB_SWITCH', 'FULLSCREEN_EXIT', 'FACE_MISSING', 'MULTIPLE_FACES', 'SUSPICIOUS_SOUND', 'SCREEN_RECORDING')
    ),
    metadata TEXT,
    timestamp TIMESTAMP NOT NULL,
    is_flagged BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE refresh_tokens (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    token VARCHAR(512) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_olympiads_status ON olympiads(status);
CREATE INDEX idx_participations_user ON participations(user_id);
CREATE INDEX idx_participations_olympiad ON participations(olympiad_id);
CREATE INDEX idx_questions_olympiad ON questions(olympiad_id);
CREATE INDEX idx_proctoring_user_time ON proctoring_events(user_id, timestamp);
