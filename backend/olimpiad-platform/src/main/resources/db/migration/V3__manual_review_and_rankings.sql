ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;
ALTER TABLE questions ADD CONSTRAINT questions_type_check
    CHECK (type IN ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT', 'CODE', 'MANUAL_REVIEW'));

ALTER TABLE participations DROP CONSTRAINT IF EXISTS participations_status_check;
ALTER TABLE participations ADD CONSTRAINT participations_status_check
    CHECK (status IN ('ACTIVE', 'PAUSED', 'PENDING_REVIEW', 'FINISHED', 'DISQUALIFIED'));

ALTER TABLE answers ADD COLUMN IF NOT EXISTS review_comment TEXT;

INSERT INTO users (id, email, password_hash, full_name, role, is_active, created_at, updated_at, version)
VALUES
    (
        '00000000-0000-0000-0000-000000000004',
        'student2@test.com',
        '$2y$05$YBDPmZHpab5DKDHiu9uzxewja75eeVog.NYsNfBGq2qdFt9rgDHpK',
        'Demo Student Two',
        'STUDENT',
        TRUE,
        NOW(),
        NOW(),
        0
    ),
    (
        '00000000-0000-0000-0000-000000000005',
        'student3@test.com',
        '$2y$05$YBDPmZHpab5DKDHiu9uzxewja75eeVog.NYsNfBGq2qdFt9rgDHpK',
        'Demo Student Three',
        'STUDENT',
        TRUE,
        NOW(),
        NOW(),
        0
    )
ON CONFLICT (email) DO NOTHING;

INSERT INTO questions (id, olympiad_id, text, type, options, correct_answer, points)
VALUES (
    '22222222-2222-2222-2222-222222222204',
    '11111111-1111-1111-1111-111111111111',
    'Describe your algorithm for checking whether a string is a palindrome. The organizer will grade the reasoning.',
    'MANUAL_REVIEW',
    NULL,
    NULL,
    10
)
ON CONFLICT (id) DO NOTHING;
