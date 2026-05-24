SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS Leveling_Answers (
    user_uuid VARCHAR(36) NOT NULL,
    leveling_id VARCHAR(36) NOT NULL,
    leveling_answer BOOLEAN NOT NULL,
    answered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_uuid, leveling_id),
    CONSTRAINT fk_leveling_answers_user
        FOREIGN KEY (user_uuid)
        REFERENCES Users(user_uuid)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_leveling_answers_item
        FOREIGN KEY (leveling_id)
        REFERENCES Leveling_Items(leveling_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
