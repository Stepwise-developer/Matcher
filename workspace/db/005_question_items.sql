SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS Question_Items (
    question_id VARCHAR(36) NOT NULL,
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL,
    min_selections INT NULL,
    max_selections INT NULL,
    min_length INT NULL,
    max_length INT NULL,
    PRIMARY KEY (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO Question_Items (
    question_id,
    title,
    body,
    question_type,
    min_selections,
    max_selections,
    min_length,
    max_length
) VALUES (
    'q_priority_action',
    '行動の優先順位',
    '次の項目を優先順位 1〜n で並べてください。',
    'ranking',
    4,
    4,
    NULL,
    NULL
)
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    body = VALUES(body),
    question_type = VALUES(question_type),
    min_selections = VALUES(min_selections),
    max_selections = VALUES(max_selections),
    min_length = VALUES(min_length),
    max_length = VALUES(max_length);
