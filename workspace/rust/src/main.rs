use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::{Json, Router, routing::get, routing::post};
use chrono::DateTime;
use serde::{Deserialize, Serialize};
use sqlx::mysql::MySqlPoolOptions;
use sqlx::{MySqlPool, Row};
use std::collections::HashMap;
use std::env;
use tokio::net::TcpListener;
use tokio::time::{Duration, sleep};
use uuid::Uuid;

#[derive(Clone)]
struct AppState {
    pool: MySqlPool,
}

#[derive(Serialize)]
struct ApiResponse<T> {
    data: T,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: ErrorBody,
}

#[derive(Serialize)]
struct ErrorBody {
    code: String,
    message: String,
    fields: HashMap<String, String>,
}

#[derive(Debug)]
struct ApiError {
    status: StatusCode,
    code: String,
    message: String,
    fields: HashMap<String, String>,
}

#[derive(Serialize, Deserialize, Clone)]
struct UserProfile {
    name: String,
    age: String,
    gender: String,
    height: String,
    weight: String,
    area: String,
    #[serde(rename = "trainLine")]
    train_line: String,
}

#[derive(Serialize)]
struct RegistrationData {
    profile: UserProfile,
    values: HashMap<String, RankingValueAnswer>,
    #[serde(rename = "valuesCompleted")]
    values_completed: bool,
    #[serde(rename = "blockedLevelingIds")]
    blocked_leveling_ids: Vec<String>,
    #[serde(rename = "completedAt")]
    completed_at: Option<String>,
}

#[derive(Serialize)]
struct RegistrationStatusData {
    registration: Option<RegistrationData>,
}

#[derive(Deserialize)]
struct LegalConsentRequest {
    consent: LegalConsent,
}

#[derive(Serialize, Deserialize)]
struct LegalConsent {
    #[serde(rename = "privacyPolicyAgreed")]
    privacy_policy_agreed: bool,
    #[serde(rename = "privacyPolicyVersion")]
    privacy_policy_version: String,
    #[serde(rename = "termsAgreed")]
    terms_agreed: bool,
    #[serde(rename = "termsVersion")]
    terms_version: String,
}

#[derive(Serialize)]
struct OkData {
    ok: bool,
}

#[derive(Deserialize)]
struct ProfileRequest {
    profile: UserProfile,
}

#[derive(Serialize)]
struct LevelingItemsData {
    items: Vec<LevelingItem>,
}

#[derive(Serialize)]
struct LevelingItem {
    id: String,
    title: String,
    body: String,
    criteria: String,
}

#[derive(Deserialize)]
struct LevelingResultRequest {
    result: LevelingResult,
}

#[derive(Deserialize)]
struct LevelingResult {
    #[serde(rename = "itemId")]
    item_id: String,
    achieved: bool,
    #[serde(rename = "answeredAt")]
    answered_at: String,
}

#[derive(Serialize)]
struct ValueQuestionsData {
    questions: Vec<RankingValueQuestion>,
}

#[derive(Serialize)]
struct RankingValueQuestion {
    id: String,
    #[serde(rename = "type")]
    question_type: String,
    title: String,
    body: String,
    options: Vec<String>,
}

#[derive(Deserialize)]
struct ValueAnswersRequest {
    answers: HashMap<String, RankingValueAnswer>,
}

#[derive(Serialize, Deserialize, Clone)]
struct RankingValueAnswer {
    #[serde(rename = "type")]
    answer_type: String,
    order: Vec<String>,
}

#[derive(Serialize)]
struct SettingsData {
    profile: UserProfile,
}

#[derive(Deserialize)]
struct FeedbackRequest {
    message: String,
    screen: Option<String>,
    #[serde(rename = "sentAt")]
    sent_at: String,
}

#[derive(Serialize)]
struct FeedbackData {
    #[serde(rename = "feedbackId")]
    feedback_id: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let database_url = read_database_url();
    let pool = connect_database(&database_url).await?;
    let state = AppState { pool };

    let app = Router::new()
        .route("/api/registration/status", get(get_registration_status))
        .route("/api/legal-consents", post(save_legal_consent))
        .route("/api/registration/profile", post(save_registration_profile))
        .route("/api/leveling/items", get(get_leveling_items))
        .route("/api/leveling/results", post(save_leveling_result))
        .route("/api/value-questions", get(get_value_questions))
        .route("/api/value-answers", post(save_value_answers))
        .route("/api/settings", get(get_settings))
        .route("/api/feedback", post(send_feedback))
        .with_state(state);

    let listener = TcpListener::bind("0.0.0.0:8080").await?;

    println!("matcher axum api is running on 0.0.0.0:8080");

    axum::serve(listener, app).await?;

    Ok(())
}

async fn get_registration_status(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<ApiResponse<RegistrationStatusData>>, ApiError> {
    let user_uuid = user_uuid_from_headers(&headers);
    let registration = load_registration(&state.pool, &user_uuid).await?;
    let data = RegistrationStatusData { registration };

    Ok(Json(ApiResponse { data }))
}

async fn save_legal_consent(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<LegalConsentRequest>,
) -> Result<Json<ApiResponse<OkData>>, ApiError> {
    if !payload.consent.privacy_policy_agreed {
        return Err(validation_error(
            "consent.privacyPolicyAgreed",
            "プライバシーポリシーへの同意が必要です。",
        ));
    }

    if !payload.consent.terms_agreed {
        return Err(validation_error(
            "consent.termsAgreed",
            "利用規約への同意が必要です。",
        ));
    }

    let user_uuid = user_uuid_from_headers(&headers);
    let consent_json = serde_json::to_string(&payload.consent)?;

    ensure_user(&state.pool, &user_uuid).await?;

    sqlx::query(
        "
        UPDATE Users
        SET
            legal_consents = ?,
            legal_consents_agreed_at = NOW()
        WHERE user_uuid = ?
        ",
    )
    .bind(consent_json)
    .bind(user_uuid)
    .execute(&state.pool)
    .await?;

    let data = OkData { ok: true };

    Ok(Json(ApiResponse { data }))
}

async fn save_registration_profile(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<ProfileRequest>,
) -> Result<Json<ApiResponse<RegistrationStatusData>>, ApiError> {
    let user_uuid = user_uuid_from_headers(&headers);

    ensure_user(&state.pool, &user_uuid).await?;

    sqlx::query(
        "
        INSERT INTO User_Profiles (
            user_uuid,
            name,
            age,
            gender,
            height,
            weight,
            area,
            trainline
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            age = VALUES(age),
            gender = VALUES(gender),
            height = VALUES(height),
            weight = VALUES(weight),
            area = VALUES(area),
            trainline = VALUES(trainline)
        ",
    )
    .bind(&user_uuid)
    .bind(&payload.profile.name)
    .bind(&payload.profile.age)
    .bind(&payload.profile.gender)
    .bind(&payload.profile.height)
    .bind(&payload.profile.weight)
    .bind(&payload.profile.area)
    .bind(&payload.profile.train_line)
    .execute(&state.pool)
    .await?;

    sqlx::query(
        "
        UPDATE Users
        SET
            values_completed = FALSE,
            registration_completed = IFNULL(registration_completed, NOW())
        WHERE user_uuid = ?
        ",
    )
    .bind(&user_uuid)
    .execute(&state.pool)
    .await?;

    let registration = load_registration(&state.pool, &user_uuid).await?;
    let data = RegistrationStatusData { registration };

    Ok(Json(ApiResponse { data }))
}

async fn get_leveling_items(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<LevelingItemsData>>, ApiError> {
    let items = load_leveling_items(&state.pool).await?;
    let data = LevelingItemsData { items };

    Ok(Json(ApiResponse { data }))
}

async fn save_leveling_result(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<LevelingResultRequest>,
) -> Result<Json<ApiResponse<RegistrationStatusData>>, ApiError> {
    let user_uuid = user_uuid_from_headers(&headers);
    let answered_at = iso_to_mysql_datetime(&payload.result.answered_at);

    ensure_user(&state.pool, &user_uuid).await?;

    sqlx::query(
        "
        INSERT INTO Leveling_Answers (
            user_uuid,
            leveling_id,
            leveling_answer,
            answered_at
        ) VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            leveling_answer = VALUES(leveling_answer),
            answered_at = VALUES(answered_at)
        ",
    )
    .bind(&user_uuid)
    .bind(&payload.result.item_id)
    .bind(payload.result.achieved)
    .bind(answered_at)
    .execute(&state.pool)
    .await?;

    let registration = load_registration(&state.pool, &user_uuid).await?;
    let data = RegistrationStatusData { registration };

    Ok(Json(ApiResponse { data }))
}

async fn get_value_questions(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<ValueQuestionsData>>, ApiError> {
    let questions = load_value_questions(&state.pool).await?;
    let data = ValueQuestionsData { questions };

    Ok(Json(ApiResponse { data }))
}

async fn save_value_answers(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<ValueAnswersRequest>,
) -> Result<Json<ApiResponse<RegistrationStatusData>>, ApiError> {
    let user_uuid = user_uuid_from_headers(&headers);

    ensure_user(&state.pool, &user_uuid).await?;

    for (question_id, answer) in payload.answers {
        if answer.answer_type != "ranking" {
            return Err(validation_error(
                "answers.type",
                "現在対応している価値観質問の形式は ranking のみです。",
            ));
        }

        let answer_json = serde_json::to_string(&answer)?;

        sqlx::query(
            "
            INSERT INTO Question_Answers (
                user_uuid,
                question_id,
                question_answer,
                answered_at
            ) VALUES (?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                question_answer = VALUES(question_answer),
                answered_at = VALUES(answered_at)
            ",
        )
        .bind(&user_uuid)
        .bind(question_id)
        .bind(answer_json)
        .execute(&state.pool)
        .await?;
    }

    let values_completed = is_values_completed(&state.pool, &user_uuid).await?;

    sqlx::query(
        "
        UPDATE Users
        SET values_completed = ?
        WHERE user_uuid = ?
        ",
    )
    .bind(values_completed)
    .bind(&user_uuid)
    .execute(&state.pool)
    .await?;

    let registration = load_registration(&state.pool, &user_uuid).await?;
    let data = RegistrationStatusData { registration };

    Ok(Json(ApiResponse { data }))
}

async fn get_settings(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<ApiResponse<SettingsData>>, ApiError> {
    let user_uuid = user_uuid_from_headers(&headers);
    let profile = load_profile(&state.pool, &user_uuid).await?;

    let data = SettingsData { profile };

    Ok(Json(ApiResponse { data }))
}

async fn send_feedback(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<FeedbackRequest>,
) -> Result<Json<ApiResponse<FeedbackData>>, ApiError> {
    if payload.message.trim().is_empty() {
        return Err(validation_error(
            "message",
            "フィードバック内容は必須です。",
        ));
    }

    let user_uuid = user_uuid_from_headers(&headers);
    let sent_at = iso_to_mysql_datetime(&payload.sent_at);
    let feedback_id = format!("fb_{}", Uuid::new_v4().simple());

    ensure_user(&state.pool, &user_uuid).await?;

    sqlx::query(
        "
        INSERT INTO Feedback (
            feedback_id,
            user_uuid,
            message,
            screen,
            sent_at
        ) VALUES (?, ?, ?, ?, ?)
        ",
    )
    .bind(&feedback_id)
    .bind(&user_uuid)
    .bind(payload.message)
    .bind(payload.screen)
    .bind(sent_at)
    .execute(&state.pool)
    .await?;

    let data = FeedbackData { feedback_id };

    Ok(Json(ApiResponse { data }))
}

async fn connect_database(database_url: &str) -> Result<MySqlPool, sqlx::Error> {
    let mut attempt_count = 0;

    loop {
        attempt_count = attempt_count + 1;

        let connect_result = MySqlPoolOptions::new()
            .max_connections(5)
            .connect(database_url)
            .await;

        match connect_result {
            Ok(pool) => {
                return Ok(pool);
            }
            Err(error) => {
                if attempt_count >= 30 {
                    return Err(error);
                }

                println!("waiting for database connection...");
                sleep(Duration::from_secs(2)).await;
            }
        }
    }
}

async fn ensure_user(pool: &MySqlPool, user_uuid: &str) -> Result<(), ApiError> {
    sqlx::query(
        "
        INSERT INTO Users (user_uuid)
        VALUES (?)
        ON DUPLICATE KEY UPDATE
            user_uuid = user_uuid
        ",
    )
    .bind(user_uuid)
    .execute(pool)
    .await?;

    Ok(())
}

async fn load_registration(
    pool: &MySqlPool,
    user_uuid: &str,
) -> Result<Option<RegistrationData>, ApiError> {
    let profile_row = sqlx::query(
        "
        SELECT
            p.name,
            p.age,
            p.gender,
            p.height,
            p.weight,
            p.area,
            p.trainline,
            u.values_completed,
            DATE_FORMAT(u.registration_completed, '%Y-%m-%dT%H:%i:%s+09:00') AS completed_at
        FROM User_Profiles p
        INNER JOIN Users u
            ON u.user_uuid = p.user_uuid
        WHERE p.user_uuid = ?
        ",
    )
    .bind(user_uuid)
    .fetch_optional(pool)
    .await?;

    let row = match profile_row {
        Some(row) => row,
        None => {
            return Ok(None);
        }
    };

    let profile = UserProfile {
        name: row.try_get("name")?,
        age: row.try_get("age")?,
        gender: row.try_get("gender")?,
        height: row.try_get("height")?,
        weight: row.try_get("weight")?,
        area: row.try_get("area")?,
        train_line: row.try_get("trainline")?,
    };

    let values_completed: bool = row.try_get("values_completed")?;
    let completed_at: Option<String> = row.try_get("completed_at")?;
    let values = load_value_answers(pool, user_uuid).await?;
    let blocked_leveling_ids = load_blocked_leveling_ids(pool, user_uuid).await?;

    let registration = RegistrationData {
        profile,
        values,
        values_completed,
        blocked_leveling_ids,
        completed_at,
    };

    Ok(Some(registration))
}

async fn load_profile(pool: &MySqlPool, user_uuid: &str) -> Result<UserProfile, ApiError> {
    let row = sqlx::query(
        "
        SELECT
            name,
            age,
            gender,
            height,
            weight,
            area,
            trainline
        FROM User_Profiles
        WHERE user_uuid = ?
        ",
    )
    .bind(user_uuid)
    .fetch_optional(pool)
    .await?;

    let row = match row {
        Some(row) => row,
        None => {
            return Err(not_found_error(
                "profile",
                "プロフィールが登録されていません。",
            ));
        }
    };

    let profile = UserProfile {
        name: row.try_get("name")?,
        age: row.try_get("age")?,
        gender: row.try_get("gender")?,
        height: row.try_get("height")?,
        weight: row.try_get("weight")?,
        area: row.try_get("area")?,
        train_line: row.try_get("trainline")?,
    };

    Ok(profile)
}

async fn load_leveling_items(pool: &MySqlPool) -> Result<Vec<LevelingItem>, ApiError> {
    let rows = sqlx::query(
        "
        SELECT
            leveling_id,
            title,
            body,
            criteria
        FROM Leveling_Items
        ORDER BY
            FIELD(
                leveling_id,
                'lv_cut_nails',
                'lv_daily_bath',
                'lv_daily_music',
                'lv_clean_clothes'
            ),
            leveling_id
        ",
    )
    .fetch_all(pool)
    .await?;

    let mut items = Vec::new();

    for row in rows {
        let item = LevelingItem {
            id: row.try_get("leveling_id")?,
            title: row.try_get("title")?,
            body: row.try_get("body")?,
            criteria: row.try_get("criteria")?,
        };

        items.push(item);
    }

    Ok(items)
}

async fn load_blocked_leveling_ids(
    pool: &MySqlPool,
    user_uuid: &str,
) -> Result<Vec<String>, ApiError> {
    let rows = sqlx::query(
        "
        SELECT
            li.leveling_id
        FROM Leveling_Items li
        LEFT JOIN Leveling_Answers la
            ON la.leveling_id = li.leveling_id
            AND la.user_uuid = ?
        WHERE
            la.leveling_answer IS NULL
            OR la.leveling_answer = FALSE
        ORDER BY
            FIELD(
                li.leveling_id,
                'lv_cut_nails',
                'lv_daily_bath',
                'lv_daily_music',
                'lv_clean_clothes'
            ),
            li.leveling_id
        ",
    )
    .bind(user_uuid)
    .fetch_all(pool)
    .await?;

    let mut ids = Vec::new();

    for row in rows {
        let id: String = row.try_get("leveling_id")?;
        ids.push(id);
    }

    Ok(ids)
}

async fn load_value_questions(pool: &MySqlPool) -> Result<Vec<RankingValueQuestion>, ApiError> {
    let question_rows = sqlx::query(
        "
        SELECT
            question_id,
            title,
            body,
            question_type
        FROM Question_Items
        ORDER BY question_id
        ",
    )
    .fetch_all(pool)
    .await?;

    let mut questions = Vec::new();

    for question_row in question_rows {
        let question_id: String = question_row.try_get("question_id")?;
        let option_rows = sqlx::query(
            "
            SELECT option_text
            FROM Question_Options
            WHERE question_id = ?
            ORDER BY display_order
            ",
        )
        .bind(&question_id)
        .fetch_all(pool)
        .await?;

        let mut options = Vec::new();

        for option_row in option_rows {
            let option_text: String = option_row.try_get("option_text")?;
            options.push(option_text);
        }

        let question = RankingValueQuestion {
            id: question_id,
            question_type: question_row.try_get("question_type")?,
            title: question_row.try_get("title")?,
            body: question_row.try_get("body")?,
            options,
        };

        questions.push(question);
    }

    Ok(questions)
}

async fn load_value_answers(
    pool: &MySqlPool,
    user_uuid: &str,
) -> Result<HashMap<String, RankingValueAnswer>, ApiError> {
    let rows = sqlx::query(
        "
        SELECT
            question_id,
            CAST(question_answer AS CHAR) AS question_answer_text
        FROM Question_Answers
        WHERE user_uuid = ?
        ORDER BY question_id
        ",
    )
    .bind(user_uuid)
    .fetch_all(pool)
    .await?;

    let mut values = HashMap::new();

    for row in rows {
        let question_id: String = row.try_get("question_id")?;
        let answer_text: String = row.try_get("question_answer_text")?;
        let answer: RankingValueAnswer = serde_json::from_str(&answer_text)?;

        values.insert(question_id, answer);
    }

    Ok(values)
}

async fn is_values_completed(pool: &MySqlPool, user_uuid: &str) -> Result<bool, ApiError> {
    let total_row = sqlx::query(
        "
        SELECT COUNT(*) AS total_count
        FROM Question_Items
        ",
    )
    .fetch_one(pool)
    .await?;

    let answered_row = sqlx::query(
        "
        SELECT COUNT(DISTINCT question_id) AS answered_count
        FROM Question_Answers
        WHERE user_uuid = ?
        ",
    )
    .bind(user_uuid)
    .fetch_one(pool)
    .await?;

    let total_count: i64 = total_row.try_get("total_count")?;
    let answered_count: i64 = answered_row.try_get("answered_count")?;

    if total_count == 0 {
        return Ok(false);
    }

    if answered_count >= total_count {
        return Ok(true);
    }

    Ok(false)
}

fn read_database_url() -> String {
    let env_result = env::var("DATABASE_URL");

    match env_result {
        Ok(value) => value,
        Err(_) => "mysql://omatcha:omatcha_password@db:3306/omatcha".to_string(),
    }
}

fn user_uuid_from_headers(headers: &HeaderMap) -> String {
    let header_value = headers.get("x-user-uuid");

    match header_value {
        Some(value) => {
            let string_result = value.to_str();

            match string_result {
                Ok(user_uuid) => {
                    if user_uuid.trim().is_empty() {
                        return "test-user-001".to_string();
                    }

                    user_uuid.to_string()
                }
                Err(_) => "test-user-001".to_string(),
            }
        }
        None => "test-user-001".to_string(),
    }
}

fn iso_to_mysql_datetime(value: &str) -> String {
    let parse_result = DateTime::parse_from_rfc3339(value);

    match parse_result {
        Ok(datetime) => datetime
            .naive_local()
            .format("%Y-%m-%d %H:%M:%S")
            .to_string(),
        Err(_) => value.to_string(),
    }
}

fn validation_error(field_name: &str, message: &str) -> ApiError {
    let mut fields = HashMap::new();

    fields.insert(field_name.to_string(), message.to_string());

    ApiError {
        status: StatusCode::BAD_REQUEST,
        code: "validation_error".to_string(),
        message: "入力内容に誤りがあります。".to_string(),
        fields,
    }
}

fn not_found_error(field_name: &str, message: &str) -> ApiError {
    let mut fields = HashMap::new();

    fields.insert(field_name.to_string(), message.to_string());

    ApiError {
        status: StatusCode::NOT_FOUND,
        code: "not_found".to_string(),
        message: message.to_string(),
        fields,
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let body = ErrorResponse {
            error: ErrorBody {
                code: self.code,
                message: self.message,
                fields: self.fields,
            },
        };

        (self.status, Json(body)).into_response()
    }
}

impl From<sqlx::Error> for ApiError {
    fn from(error: sqlx::Error) -> Self {
        ApiError {
            status: StatusCode::INTERNAL_SERVER_ERROR,
            code: "database_error".to_string(),
            message: format!("データベース処理に失敗しました: {}", error),
            fields: HashMap::new(),
        }
    }
}

impl From<serde_json::Error> for ApiError {
    fn from(error: serde_json::Error) -> Self {
        ApiError {
            status: StatusCode::BAD_REQUEST,
            code: "json_error".to_string(),
            message: format!("JSONの処理に失敗しました: {}", error),
            fields: HashMap::new(),
        }
    }
}
