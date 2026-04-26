# カレカノを作ろうの会 サンプルサイト

AIが自動的に相性を判断するマッチングサービス「カレカノを作ろうの会」の静的サンプルサイトです。
複数HTMLへ移動する構成ではなく、`index.html`内で画面を切り替えるスプラッシュ型フローとして実装しています。

## サービス概要

カレカノを作ろうの会は、ユーザーごとの情報量に応じて段階的にレベリングし、準備が整った人からAIが相手候補を選ぶマッチングを始めるサービスという設定です。
今回は初期登録までの画面フローを扱うため、レベリング項目は足切り用の2～3問に限定しています。
実際のAI判定APIには未接続で、入力情報は`localStorage`に保存し、Stage0到達後に固定のマッチング・チャット画面を表示します。

## アプリ開始フロー

すべての画面は`index.html`にあります。`js/app.js`が`data-screen`属性を見て表示対象を切り替え、ボタンの`data-go`属性で次の画面を指定します。

1. `top`
   Top画面。サービス名「カレカノを作ろうの会」と登録の流れを表示します。
2. `register`
   登録画面。生年月日、ニックネーム、性別、地域、身長、体重を入力します。
3. `leveling`
   レベリング項目表示。初期登録用として以下のうち3問を表示しています。
   - 爪を定期的に切っているか（2週間に1回以上）
   - 毎日洗濯した服を着ているか
   - 毎日歯を磨いているか
4. `values`
   価値観についての質問。自由記述で2問回答します。
5. `stage0`
   LU項目と価値観質問の両方が完了したことを示すステージUP画面です。
6. `main`
   マッチングとチャット画面。Stage0のユーザー状態、マッチングした人とのチャットUIを表示します。

## CSS構成

- `css/base.css`
  既存の共通レイアウト、フォーム、メイン画面、チャット画面、テーマ選択UIを定義します。
- `css/app-flow.css`
  今回追加した初期登録フロー専用の補助スタイルです。既存CSSを変更しないため、このファイルに新規UIの差分をまとめています。
- `css/theme-warm-mincho.css`
  今回追加した初期UIテーマです。明朝体系のフォントと暖色系カラーセットを使います。
- 既存テーマ
  `theme-modern.css`、`theme-soft.css`、`theme-contrast.css`、`theme-classic.css`、`theme-editorial.css`、`theme-neon.css`、`theme-corporate.css`、`theme-craft.css`、`theme-mono.css`、`theme-retro95.css`

`select[data-theme-select]`からテーマを切り替えられます。選択したテーマは`localStorage`の`karekano-theme`に保存され、画面遷移後も維持されます。

## JavaScript構成

- `js/theme.js`
  テーマCSSを切り替え、選択状態を保存します。初期テーマは`theme-warm-mincho.css`です。
- `js/app.js`
  スプラッシュ型の画面遷移、登録フォーム、LUフォーム、価値観フォームの保存、Stage0への遷移、メイン画面へのニックネーム反映を担当します。

## 次のエージェントAI向けメモ

- 既存CSSは触らず、今回の追加分は`app-flow.css`と`theme-warm-mincho.css`に分離しています。
- 画面を増やす場合は、`index.html`に`<section class="screen" data-screen="...">`を追加し、遷移ボタンに`data-go="..."`を指定してください。
- 実AI連携を追加する場合は、`js/app.js`の各フォーム送信処理でAPI用データを組み立て、Stage0または`main`の表示前にAIレスポンスを反映してください。
- レベリング質問を増やす場合は、`leveling`画面の`fieldset.choice-field`を追加し、必要に応じてStage0到達条件を`js/app.js`側に追加してください。

ブラウザで`index.html`を開くだけで確認できます。
