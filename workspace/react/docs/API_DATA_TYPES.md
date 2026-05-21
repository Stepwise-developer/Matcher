# API データ型定義

## 役割

現状の UI で、バックエンドとの通信や保存が必要になるデータを TypeScript の型として整理します。

定義は `src/types/api.ts` にまとめます。各型には、何のデータかが分かるようにコメントを残しています。

## 定義した主なデータ

- API共通: `ApiId`、`ApiDateTime`、`ApiSuccessResponse`、`ApiErrorResponse`
- ユーザー登録: `UserProfile`、`RegistrationData`、`LegalConsent`、`SaveLegalConsentRequest`、`CompleteRegistrationRequest`、`RegistrationStatusResponse`
- レベリング: `LevelingItem`、`LevelingResult`、`LevelingItemsResponse`、`UpdateLevelingResultRequest`
- 価値観質問: `ValueQuestion`、`ValueAnswers`、`ValueQuestionsResponse`、`SaveValueAnswersRequest`
- Home: `HomeDashboardData`、`HomeDashboardResponse`
- マッチ相手: `MatchPartner`
- メッセージ: `ChatMessage`、`ChatThreadResponse`、`SendMessageRequest`、`SendMessageResponse`
- 設定: `SettingsData`、`SettingsResponse`、`FeedbackRequest`、`FeedbackResponse`

## 関連ドキュメント

- `docs/DATA_FLOW.md`: TypeScript 型を基にしたデータフロー図
- `docs/INPUT_CACHE_STRATEGY.md`: 入力キャッシュと一括送信の設計方針

## 現状の扱い

現時点では UI 内のダミーデータと localStorage を使っています。

ただし、`src/app/page.tsx` の主要な画面データは `src/types/api.ts` の型を参照するようにし、後日バックエンド API に置き換えやすい境界を作っています。

## 今後の予定

- ダミーデータを `src/lib` または `src/api` 配下へ分離する
- API 呼び出し関数を画面コンポーネントから分離する
- バックエンド統合時に、各 request / response 型を実際のエンドポイントと対応させる
