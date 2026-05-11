use axum::{Json, Router, routing::post};
use serde::{Deserialize, Serialize};
use tokio::net::TcpListener;

#[derive(Deserialize)]
struct MessageRequest {
    message: String,
}

#[derive(Serialize)]
struct MessageResponse {
    received: bool,
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let app = Router::new().route("/matcha-api/message", post(receive_message));
    let listener = TcpListener::bind("0.0.0.0:8080").await?;

    println!("omatcha axum api is running on 0.0.0.0:8080");

    axum::serve(listener, app).await
}

async fn receive_message(Json(payload): Json<MessageRequest>) -> Json<MessageResponse> {
    println!("received message: {}", payload.message);

    Json(MessageResponse { received: true })
}
