SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS User_Profiles (
    user_uuid VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    age VARCHAR(10) NOT NULL,
    gender VARCHAR(50) NOT NULL,
    height VARCHAR(10) NOT NULL,
    weight VARCHAR(10) NOT NULL,
    area VARCHAR(100) NOT NULL,
    trainline VARCHAR(100) NOT NULL,
    PRIMARY KEY (user_uuid),
    CONSTRAINT fk_user_profiles_user
        FOREIGN KEY (user_uuid)
        REFERENCES Users(user_uuid)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
