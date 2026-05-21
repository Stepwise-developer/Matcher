# データフロー図

## 目的

`src/types/api.ts` に定義した TypeScript 型を基に、現在のフロントエンドで扱うデータの流れを整理します。

現状はダミーデータと `localStorage` で動作していますが、後日バックエンド API に置き換える時に、どの画面がどのデータを取得・送信するかを確認しやすくするための図です。

## 全体フロー

```mermaid
flowchart TD
  Start["初回アクセス"]
  Status["登録状態取得\nRegistrationStatusResponse"]
  Consent["規約同意画面\nLegalConsent"]
  SaveConsent["規約同意保存\nSaveLegalConsentRequest"]
  Profile["プロフィール登録画面\nUserProfile"]
  CompleteProfile["プロフィール登録\nCompleteRegistrationRequest"]
  Registration["登録状態\nRegistrationData"]
  Home["Home\nHomeDashboardData"]
  Leveling["レベリング項目\nLevelingItem[]"]
  LevelingResult["達成状態更新\nUpdateLevelingResultRequest"]
  Values["価値観質問\nValueQuestion[]"]
  ValueAnswers["価値観回答保存\nSaveValueAnswersRequest"]
  MessageLock{"メッセージ解放条件\nレベリング完了 + 価値観完了"}
  Messages["メッセージ画面\nChatThreadResponse"]
  SendMessage["メッセージ送信\nSendMessageRequest"]
  Settings["設定画面\nSettingsResponse"]
  Feedback["意見箱送信\nFeedbackRequest"]

  Start --> Status
  Status -->|registration が null| Consent
  Status -->|registration が存在| Registration
  Consent --> SaveConsent --> Profile
  Profile --> CompleteProfile --> Registration
  Registration --> Home
  Registration --> Leveling
  Registration --> Values
  Registration --> Settings
  Leveling --> LevelingResult --> Registration
  Values --> ValueAnswers --> Registration
  Registration --> MessageLock
  MessageLock -->|未完了| Home
  MessageLock -->|完了| Messages
  Messages --> SendMessage --> Messages
  Settings --> Feedback
```

## 初回登録

```mermaid
sequenceDiagram
  participant UI as フロントエンド
  participant API as バックエンドAPI
  participant Store as localStorage / DB

  UI->>API: RegistrationStatusResponse を取得
  API->>Store: 登録状態を確認
  Store-->>API: RegistrationData または null
  API-->>UI: registration

  alt 未登録
    UI->>UI: プライバシーポリシーと利用規約を表示
    UI->>API: SaveLegalConsentRequest
    API->>Store: LegalConsent を保存
    UI->>API: CompleteRegistrationRequest
    API->>Store: UserProfile を保存
    API-->>UI: RegistrationStatusResponse
  else 登録済み
    UI->>UI: Home を表示
  end
```

初回登録で確定するのは `UserProfile` です。レベリングと価値観質問は、登録完了後に各タブで進めます。

## レベリング

```mermaid
flowchart LR
  FetchItems["項目一覧取得\nLevelingItemsResponse"]
  Card["カード表示\nLevelingItem"]
  Swipe["左右スワイプ判定\nLevelingResult"]
  Update["達成状態更新\nUpdateLevelingResultRequest"]
  Registration["RegistrationData.blockedLevelingIds 更新"]

  FetchItems --> Card --> Swipe --> Update --> Registration
```

`blockedLevelingIds` に残っている項目が未達成として扱われます。すべて解消されると、メッセージ解放条件の片方を満たします。

## 価値観質問

```mermaid
flowchart TD
  FetchQuestions["質問一覧取得\nValueQuestionsResponse"]
  Question{"ValueQuestion.type"}
  Ranking["並べ替え式\nRankingValueAnswer"]
  Checkbox["チェックボックス式\nCheckboxValueAnswer"]
  Text["自由記述式\nTextValueAnswer"]
  Answers["質問IDごとの回答\nValueAnswers"]
  Save["回答保存\nSaveValueAnswersRequest"]
  Registration["RegistrationData.values / valuesCompleted 更新"]

  FetchQuestions --> Question
  Question -->|ranking| Ranking
  Question -->|checkbox| Checkbox
  Question -->|text| Text
  Ranking --> Answers
  Checkbox --> Answers
  Text --> Answers
  Answers --> Save --> Registration
```

質問方式は `ValueQuestion` の union で分岐します。1つの質問に複数方式を混在させず、回答側も同じ `type` の `ValueAnswer` として保存します。

## メッセージ

```mermaid
sequenceDiagram
  participant UI as メッセージ画面
  participant API as バックエンドAPI
  participant DB as DB

  UI->>API: ChatThreadResponse を取得
  API->>DB: 現在会話中の1名と履歴を取得
  DB-->>API: MatchPartner + ChatMessage[]
  API-->>UI: partner, messages

  UI->>API: SendMessageRequest
  API->>DB: ChatMessage を保存
  API-->>UI: SendMessageResponse
```

本アプリでは同時に会話できる相手は1名だけです。メッセージ送信は、Enterではなく送信ボタン押下時だけ行います。

## 設定・意見箱

```mermaid
flowchart LR
  Settings["設定表示\nSettingsResponse"]
  Profile["プロフィール確認\nUserProfile"]
  FeedbackForm["意見箱入力"]
  FeedbackRequest["送信\nFeedbackRequest"]
  FeedbackResponse["受付結果\nFeedbackResponse"]

  Settings --> Profile
  Settings --> FeedbackForm --> FeedbackRequest --> FeedbackResponse
```

設定画面では登録済みプロフィールを表示し、意見箱から `FeedbackRequest` を送信します。

## バックエンド統合時の境界

- 登録状態、プロフィール、同意履歴はユーザー単位で永続化します。
- `LevelingItem` と `ValueQuestion` は、将来的に管理画面やDBから配信できる前提にします。
- メッセージは `MatchPartner` が1名である制約をAPI側でも保証します。
- フロントエンドは `ApiSuccessResponse<T>` と `ApiErrorResponse` を共通形として扱います。

## 関連ドキュメント

- `docs/INPUT_CACHE_STRATEGY.md`: ユーザー入力をキャッシュし、まとまりごとに一括送信する方針
