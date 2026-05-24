SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS Question_Answers (
    user_uuid VARCHAR(36) NOT NULL,
    question_id VARCHAR(36) NOT NULL,
    question_answer JSON NOT NULL,
    answered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_uuid, question_id),
    CONSTRAINT fk_question_answers_user
        FOREIGN KEY (user_uuid)
        REFERENCES Users(user_uuid)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_question_answers_item
        FOREIGN KEY (question_id)
        REFERENCES Question_Items(question_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
