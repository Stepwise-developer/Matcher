SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS Feedback (
    feedback_id VARCHAR(36) NOT NULL,
    user_uuid VARCHAR(36) NOT NULL,
    message TEXT NOT NULL,
    screen VARCHAR(100) NULL,
    sent_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (feedback_id),
    CONSTRAINT fk_feedback_user
        FOREIGN KEY (user_uuid)
        REFERENCES Users(user_uuid)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
