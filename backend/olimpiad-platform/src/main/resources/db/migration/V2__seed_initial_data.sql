INSERT INTO users (id, email, password_hash, full_name, role, is_active, created_at, updated_at, version)
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'admin@test.com',
        '$2y$05$aGKZOEd53P7sWBXGEnk09.wghE1X/p1noctPlzrKrlb/Q0l2T1OAC',
        'System Admin',
        'ADMIN',
        TRUE,
        NOW(),
        NOW(),
        0
    ),
    (
        '00000000-0000-0000-0000-000000000002',
        'org@test.com',
        '$2y$05$/23F2SISd/Aj6eH.baLV9ecBEKSiJsZdTYK.M6kh0s6vzZ4cyERki',
        'Demo Organizer',
        'ORGANIZER',
        TRUE,
        NOW(),
        NOW(),
        0
    ),
    (
        '00000000-0000-0000-0000-000000000003',
        'student@test.com',
        '$2y$05$YBDPmZHpab5DKDHiu9uzxewja75eeVog.NYsNfBGq2qdFt9rgDHpK',
        'Demo Student',
        'STUDENT',
        TRUE,
        NOW(),
        NOW(),
        0
    )
ON CONFLICT (email) DO NOTHING;

INSERT INTO olympiads (
    id,
    title,
    description,
    start_time,
    end_time,
    duration_minutes,
    status,
    created_by,
    created_at,
    updated_at
)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Demo Programming Olympiad',
    'Seed olympiad for checking participation, answer submission and proctoring flow.',
    NOW() - INTERVAL '1 hour',
    NOW() + INTERVAL '30 days',
    90,
    'PUBLISHED',
    'org@test.com',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, olympiad_id, text, type, options, correct_answer, points)
VALUES
    (
        '22222222-2222-2222-2222-222222222201',
        '11111111-1111-1111-1111-111111111111',
        'What is the result of 2 + 2?',
        'SINGLE_CHOICE',
        '["3","4","5","22"]',
        '4',
        5
    ),
    (
        '22222222-2222-2222-2222-222222222202',
        '11111111-1111-1111-1111-111111111111',
        'Select Java primitive integer types.',
        'MULTIPLE_CHOICE',
        '["int","Integer","long","String"]',
        'int,long',
        10
    ),
    (
        '22222222-2222-2222-2222-222222222203',
        '11111111-1111-1111-1111-111111111111',
        'Name the HTTP method commonly used to create a resource.',
        'TEXT',
        NULL,
        'POST',
        5
    )
ON CONFLICT (id) DO NOTHING;
