# Omatcha プロジェクトドキュメント

## 概要

Omatcha は React、Rust、nginx を Docker Compose で連携させた最小構成のプロジェクトです。フロントエンドはスマホ対応を考慮した設計になっています。

---

## 環境構成

### システムアーキテクチャ

```
クライアント (ブラウザ)
    ↓ (HTTPS:443)
nginx (リバースプロキシ)
    ├─ /matcha/ → React (内部ポート: 5173)
    └─ /matcha-api/ → Rust Axum API (内部ポート: 8080)
```

### 各コンテナの役割

| コンテナ名 | 用途 | ポート | 起動コマンド |
|-----------|------|--------|-----------|
| `omatcha_nginx` | リバースプロキシ (HTTPS) | 443 | Nginx サーバー |
| `omatcha_react` | フロントエンド | 5173 | `npm install && npm run dev -- --host 0.0.0.0` |
| `omatcha_rust` | バックエンド API | 8080 | `cargo run` |

---

## フロントエンド (React) の利用技術

### 依存ライブラリ

```json
{
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "@vitejs/plugin-react": "^4.4.1",
    "vite": "^6.3.5"
  }
}
```

| ライブラリ | 用途 | バージョン |
|-----------|------|-----------|
| **React** | UI フレームワーク | 19.1.0 |
| **React DOM** | DOM レンダリング | 19.1.0 |
| **Vite** | ビルドツール・開発サーバー | 6.3.5 |
| **@vitejs/plugin-react** | React 用 Vite プラグイン (JSX サポート) | 4.4.1 |

### 開発スクリプト

```bash
npm run dev      # 開発サーバーを起動 (http://localhost:5173)
npm run build    # 本番ビルド (dist/ フォルダに出力)
```

### ファイル構成

```
workspace/react/
├── index.html           # エントリポイント (viewport メタタグを含む)
├── src/
│   ├── main.jsx         # React アプリケーション本体
│   └── style.css        # スタイル (レスポンシブ対応)
├── package.json         # 依存関係の定義
└── vite.config.js       # Vite 設定 (base: "/matcha/")
```

---

## バックエンド (Rust) の利用技術

### 依存ライブラリ

```toml
[dependencies]
axum = "0.8"                           # Web フレームワーク
serde = { version = "1", features = ["derive"] }  # シリアライズ・デシリアライズ
tokio = { version = "1", features = ["macros", "rt-multi-thread"] }  # 非同期ランタイム
```

| ライブラリ | 用途 | バージョン |
|-----------|------|-----------|
| **Axum** | Web フレームワーク | 0.8 |
| **Serde** | JSON シリアライズ・デシリアライズ | 1.x |
| **Tokio** | 非同期ランタイム | 1.x (マルチスレッド対応) |

### ビルド・実行

```bash
cargo run       # ビルド + 実行 (開発モード)
cargo build     # ビルドのみ
```

---

## 動作の仕組み

### フロントエンド → バックエンド の流れ

1. **ユーザー操作**: React フォームにメッセージを入力して「Send」ボタンをクリック
2. **メッセージ送信**: JavaScript の `fetch()` で `/matcha-api/message` に POST リクエスト送信
3. **nginx の処理**: `/matcha-api/` で始まるリクエストを Rust コンテナ (ポート 8080) へ転送
4. **Rust API の処理**: Axum が JSON リクエストを受け取り、標準出力にメッセージを出力
5. **レスポンス返却**: API が 200 OK レスポンスを返す
6. **React の更新**: ステータスメッセージ「送信しました。」を画面に表示

### API エンドポイント

#### POST `/matcha-api/message`

**リクエスト**:
```json
{
  "message": "Hello Axum"
}
```

**レスポンス** (成功時):
```
200 OK
```

---

## スマホ対応の実装方法

### 1. 現状のレスポンシブ対応

既に `style.css` に基本的なモバイル対応が実装されています：

```css
@media (max-width: 560px) {
  .inputRow {
    grid-template-columns: 1fr;  /* 2 列 → 1 列 */
  }
  button {
    min-height: 48px;  /* モバイル用のタップターゲットサイズ */
  }
}
```

### 2. スマホ用の新規コンポーネント作成方法

#### A. **推奨: 既存CSSの拡張（最小変更）**

`style.css` にスマホ用のスタイルを追加：

```css
/* タッチデバイス用のスタイル */
@media (hover: none) and (pointer: coarse) {
  button {
    min-height: 48px;  /* Apple HIG: 最小 44pt */
    font-size: 16px;   /* iOS 自動ズームを防止 */
  }
  
  input {
    font-size: 16px;   /* iOS 自動ズームを防止 */
    border-radius: 4px;  /* iOS の default スタイルを上書き */
  }
}

/* 小型スマホ対応 */
@media (max-width: 375px) {
  .hero {
    padding: 16px;
  }
  
  h1 {
    font-size: clamp(28px, 7vw, 40px);
  }
  
  p {
    font-size: 16px;
  }
}
```

#### B. **コンポーネント分岐（大きな UI 変更が必要な場合）**

`src/main.jsx` を以下のように拡張：

```javascript
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  return isMobile;
}

function DesktopApp() {
  // デスクトップ用 UI
  return <main className="page">/* ... */</main>;
}

function MobileApp() {
  // スマホ用 UI (より簡潔なレイアウト)
  return <main className="page mobile">/* ... */</main>;
}

function App() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileApp /> : <DesktopApp />;
}

createRoot(document.getElementById("root")).render(<App />);
```

#### C. **タッチイベント対応（スマホジェスチャー）**

長押しやスワイプ対応が必要な場合：

```javascript
// src/hooks/useTouch.js
export function useTouch() {
  const handleTouchStart = (e) => {
    // タッチ開始時の処理
  };
  
  const handleTouchEnd = (e) => {
    // タッチ終了時の処理
  };
  
  return { handleTouchStart, handleTouchEnd };
}
```

### 3. 必須の実装チェックリスト

- [x] **viewport メタタグ**: 既に `index.html` に実装済み
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ```

- [ ] **フォント サイズ**: iOS 自動ズームを防止（16px 以上推奨）

- [ ] **タップターゲット**: ボタンは最小 44×44px（Apple ガイドライン）

- [ ] **Safe Area**: ノッチ対応
  ```css
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) 
           max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  ```

---

## テスト方法

### 方法 1: ブラウザのデベロッパーツール（推奨）

1. Docker コンテナを起動:
   ```bash
   docker-compose up -d
   ```

2. ブラウザで開く:
   ```
   https://localhost/matcha/
   ```

3. **Chrome/Firefox のデベロッパーツール** (F12 または ⌘+Option+I):
   - **デバイスエミュレーション**: Ctrl+Shift+M (Windows) / ⌘+Shift+M (Mac)
   - プリセット: iPhone, iPad, Pixel など選択可能
   - **レスポンシブ デザインモード**: 任意のサイズに変更可能

### 方法 2: 実機テスト

1. **macOS の場合**:
   ```bash
   # ホストの IP アドレスを確認
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **iPhone/Android から** `https://<mac-ip>/matcha/` にアクセス

3. **自己署名証明書の警告が出る場合**: 「詳細」→「このサイトにアクセス」

### 方法 3: 各種スクリーンサイズでのテスト

| デバイス | 幅 | テスト方法 |
|---------|-----|----------|
| iPhone 15 | 393px | Chrome DevTools: iPhone 15 |
| iPhone SE | 375px | Chrome DevTools: iPhone SE |
| iPad | 768px | Chrome DevTools: iPad |
| Android | 360-412px | Chrome DevTools: Pixel 6 |

### ログの確認

```bash
# Rust バックエンドのログを確認
docker logs omatcha_rust

# React ビルドエラーを確認
docker logs omatcha_react

# nginx のエラーログを確認
docker logs omatcha_nginx
```

---

## ホットリロードの動作

### React 側の自動リロード

- `src/main.jsx` や `src/style.css` を編集すると、Vite が自動的に変更を検知
- ブラウザが自動更新（HMR: Hot Module Replacement）
- ホストマシンのエディタで編集するだけで OK

### Rust 側の自動リコンパイル

- `cargo run` は通常、開発モード時には `cargo-watch` がないため手動再起動が必要
- `cargo-watch` を追加すれば自動リコンパイル可能:
  ```bash
  cargo install cargo-watch
  cargo watch -x run
  ```

---

## Codex 用ディレクトリ構成

このリポジトリでは、Codex が作業しやすいように 3 つのディレクトリを用意しています。

- `codex_est/`:
  - Codex が自由に変更して実際に表示させるテスト用の作業領域
  - `git` には含めないように `.gitignore` に登録済み
  - `docker-compose.codex.yml` を使って起動できます
- `workspace/`:
  - いまの最小限の現状動作を保証するベースライン
- `dev/`:
  - 完成品を格納するための作業領域
  - `dev/react/`, `dev/rust/`, `dev/nginx/` のプレースホルダーを用意しています

### Codex 用テストの起動方法

以下のコマンドで `codex_est` を使ったコンテナ構成を起動します。

```bash
docker compose -f docker-compose.yml -f docker-compose.codex.yml up -d
```

この構成では、React・Rust・nginx のいずれも `codex_est/` 以下の内容を参照するようになります。

---

## トラブルシューティング

### ポート競合エラー

```
Error: Port 443 is already in use
```

**解決方法**:
```bash
# コンテナを停止
docker-compose down

# ポート確認 (macOS)
lsof -i :443

# プロセス終了
kill -9 <PID>
```

### 自己署名証明書の警告

nginx で SSL エラーが出る場合、ブラウザで「詳細」→「このサイトにアクセス」をクリック

### モジュール not found エラー

```
npm ERR! MODULE_NOT_FOUND
```

**解決方法**:
```bash
docker-compose down
docker-compose up -d
# npm install が再実行される
```

---

## 参考資料

- [React 公式ドキュメント](https://react.dev)
- [Vite 公式ドキュメント](https://vitejs.dev)
- [Axum Web Framework](https://github.com/tokio-rs/axum)
- [MDN: レスポンシブデザイン](https://developer.mozilla.org/ja/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)
