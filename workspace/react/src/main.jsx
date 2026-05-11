import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  async function sendMessage(event) {
    event.preventDefault();

    if (!message.trim()) {
      setStatus("メッセージを入力してください。");
      return;
    }

    setStatus("送信中...");

    try {
      const response = await fetch("/matcha-api/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error("request failed");
      }

      setMessage("");
      setStatus("送信しました。Rust コンテナの標準出力に表示されます。");
    } catch {
      setStatus("送信に失敗しました。");
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Omatcha</p>
        <h1>Send a message.</h1>
        <p>Axum API にメッセージを送り、Rust 側の標準出力に表示します。</p>

        <form className="messageForm" onSubmit={sendMessage}>
          <label htmlFor="message">Message</label>
          <div className="inputRow">
            <input
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Hello Axum"
            />
            <button type="submit">Send</button>
          </div>
          {status && <p className="status">{status}</p>}
        </form>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
