SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS Users (
    user_uuid VARCHAR(36) NOT NULL,
    user_level INT NOT NULL DEFAULT 1,
    nick_name VARCHAR(100) NULL,
    birth_date DATE NULL,
    values_completed BOOLEAN NOT NULL DEFAULT FALSE,
    registration_completed DATETIME NULL,
    legal_consents JSON NULL,
    legal_consents_agreed_at DATETIME NULL,
    PRIMARY KEY (user_uuid),
    UNIQUE KEY uq_users_nick_name_birth_date (nick_name, birth_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
