SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS Leveling_Items (
    leveling_id VARCHAR(36) NOT NULL,
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL,
    criteria VARCHAR(50) NOT NULL,
    PRIMARY KEY (leveling_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO Leveling_Items (
    leveling_id,
    title,
    body,
    criteria
) VALUES
    ('lv_cut_nails', '爪を切る', '爪を週に2回以上切っている', 'boolean'),
    ('lv_daily_bath', '入浴する', '毎日シャワーまたはお風呂に入っている', 'boolean'),
    ('lv_daily_music', '音楽を聴く', '毎日1回以上曲を聴いている', 'boolean'),
    ('lv_clean_clothes', '清潔な服を着る', '毎日洗濯された肌着や洋服を着ている', 'boolean')
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    body = VALUES(body),
    criteria = VALUES(criteria);
