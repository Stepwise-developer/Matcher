SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS Question_Options (
    option_id VARCHAR(36) NOT NULL,
    question_id VARCHAR(36) NOT NULL,
    option_text TEXT NOT NULL,
    display_order INT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (option_id),
    CONSTRAINT fk_question_options_item
        FOREIGN KEY (question_id)
        REFERENCES Question_Items(question_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO Question_Options (
    option_id,
    question_id,
    option_text,
    display_order
) VALUES
    ('opt_priority_housework', 'q_priority_action', '家事をする', 1),
    ('opt_priority_new_place', 'q_priority_action', '知らない場所に行く', 2),
    ('opt_priority_tasks', 'q_priority_action', '溜めていた用事を片付ける', 3),
    ('opt_priority_meet_people', 'q_priority_action', '友人や知人に会う', 4)
ON DUPLICATE KEY UPDATE
    question_id = VALUES(question_id),
    option_text = VALUES(option_text),
    display_order = VALUES(display_order),
    updated_at = CURRENT_TIMESTAMP;
