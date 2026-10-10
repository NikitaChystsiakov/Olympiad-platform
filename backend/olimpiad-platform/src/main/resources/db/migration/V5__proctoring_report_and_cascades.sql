-- Deleting an olympiad must also remove its attempts (answers/files cascade from participations).
ALTER TABLE participations DROP CONSTRAINT IF EXISTS fk_participations_olympiad;
ALTER TABLE participations ADD CONSTRAINT fk_participations_olympiad
    FOREIGN KEY (olympiad_id) REFERENCES olympiads(id) ON DELETE CASCADE;

ALTER TABLE participations DROP CONSTRAINT IF EXISTS fk_participations_user;
ALTER TABLE participations ADD CONSTRAINT fk_participations_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- New client-side signals.
ALTER TABLE proctoring_events DROP CONSTRAINT IF EXISTS proctoring_events_event_type_check;
ALTER TABLE proctoring_events ADD CONSTRAINT proctoring_events_event_type_check
    CHECK (event_type IN ('TAB_SWITCH', 'FULLSCREEN_EXIT', 'FACE_MISSING', 'MULTIPLE_FACES',
                          'COPY_PASTE', 'CAMERA_UNAVAILABLE', 'SUSPICIOUS_SOUND', 'SCREEN_RECORDING'));

CREATE INDEX IF NOT EXISTS idx_proctoring_olympiad_time ON proctoring_events(olympiad_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_answers_participation ON answers(participation_id);
