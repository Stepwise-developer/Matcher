/**
 * API共通: バックエンド側で永続化される各データのID。
 * UIでは文字列として扱い、DB実装時にUUIDや連番へ置き換えられるようにする。
 */
export type ApiId = string;

/**
 * API共通: 日時文字列。
 * バックエンド統合時は ISO 8601 形式の文字列を想定する。
 */
export type ApiDateTime = string;

/**
 * API共通: APIレスポンスの成功形。
 * 各エンドポイントの戻り値を data に入れて扱う。
 */
export type ApiSuccessResponse<TData> = {
  data: TData;
};

/**
 * API共通: APIレスポンスの失敗形。
 * フォームエラーや認証エラーなどを画面表示するために使う。
 */
export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
};

/**
 * ユーザー基本情報: 初回登録フォームで入力するプロフィール。
 * マッチング、設定表示、候補表示の条件として保存する。
 */
export type UserProfile = {
  name: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  area: string;
  trainLine: string;
};

/**
 * ユーザー登録状態: 初回登録完了後に保存するオンボーディング結果。
 * 現状は localStorage に保存しているが、バックエンド統合後はユーザー状態APIで管理する。
 */
export type RegistrationData = {
  profile: UserProfile;
  values: ValueAnswers;
  valuesCompleted: boolean;
  blockedLevelingIds: ApiId[];
  completedAt: ApiDateTime;
};

/**
 * ユーザー登録API: 初回登録を完了させる時に送信するデータ。
 * プロフィール、価値観回答、未達成レベリング項目をまとめて保存する。
 */
export type CompleteRegistrationRequest = {
  profile: UserProfile;
  values: ValueAnswers;
  blockedLevelingIds: ApiId[];
};

/**
 * ユーザー登録API: 登録状態取得のレスポンス。
 * 未登録の場合は registration を null として扱う。
 */
export type RegistrationStatusResponse = ApiSuccessResponse<{
  registration: RegistrationData | null;
}>;

/**
 * レベリング項目: 初回確認やレベリング詳細画面で表示する改善項目。
 * title はカード見出し、body は詳細説明として表示する。
 */
export type LevelingItem = {
  id: ApiId;
  title: string;
  body: string;
  criteria: string;
};

/**
 * レベリング判定: ユーザーが項目を達成済みかどうかを記録する結果。
 * 初回登録の左右スワイプや、未達成項目の回収で利用する。
 */
export type LevelingResult = {
  itemId: ApiId;
  achieved: boolean;
  answeredAt: ApiDateTime;
};

/**
 * レベリングAPI: 項目一覧取得のレスポンス。
 * UI上のカードや詳細画面をバックエンド管理にするための型。
 */
export type LevelingItemsResponse = ApiSuccessResponse<{
  items: LevelingItem[];
}>;

/**
 * レベリングAPI: 達成状態更新のリクエスト。
 * ユーザーがスワイプで判定した内容を保存するために使う。
 */
export type UpdateLevelingResultRequest = {
  result: LevelingResult;
};

/**
 * 価値観質問共通: 全方式で共通して持つ質問情報。
 * type により、並べ替え、チェックボックス、自由記述のどれで回答するかを分ける。
 */
export type ValueQuestionBase = {
  id: ApiId;
  title: string;
  body: string;
};

/**
 * 価値観質問: 並べ替え式。
 * options の数は質問ごとに変えられ、回答では配列の先頭ほど優先度が高いものとして扱う。
 */
export type RankingValueQuestion = ValueQuestionBase & {
  type: "ranking";
  options: string[];
};

/**
 * 価値観質問: チェックボックス式。
 * minSelections / maxSelections により、選択数の制約を質問ごとに設定できる。
 */
export type CheckboxValueQuestion = ValueQuestionBase & {
  type: "checkbox";
  options: string[];
  minSelections?: number;
  maxSelections?: number;
};

/**
 * 価値観質問: 自由記述式。
 * minLength / maxLength により、文字数の制約を質問ごとに設定できる。
 */
export type TextValueQuestion = ValueQuestionBase & {
  type: "text";
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
};

/**
 * 価値観質問: UI が扱う質問方式の union。
 * 1つの質問には1つの回答方式だけを持たせ、複数方式を混在させない。
 */
export type ValueQuestion =
  | RankingValueQuestion
  | CheckboxValueQuestion
  | TextValueQuestion;

/**
 * 価値観回答: 並べ替え式の回答。
 * order の先頭ほどユーザーが優先する行動として保存する。
 */
export type RankingValueAnswer = {
  type: "ranking";
  order: string[];
};

/**
 * 価値観回答: チェックボックス式の回答。
 * selected にユーザーが選んだ選択肢を保存する。
 */
export type CheckboxValueAnswer = {
  type: "checkbox";
  selected: string[];
};

/**
 * 価値観回答: 自由記述式の回答。
 * text にユーザーの入力内容を保存する。
 */
export type TextValueAnswer = {
  type: "text";
  text: string;
};

/**
 * 価値観回答: 質問IDごとの回答。
 * 質問の type と同じ type の回答を保存する。
 */
export type ValueAnswer =
  | RankingValueAnswer
  | CheckboxValueAnswer
  | TextValueAnswer;

export type ValueAnswers = {
  [questionId: ApiId]: ValueAnswer;
};

/**
 * 価値観API: 質問一覧取得のレスポンス。
 * オンボーディングで表示する質問内容をバックエンド管理にするための型。
 */
export type ValueQuestionsResponse = ApiSuccessResponse<{
  questions: ValueQuestion[];
}>;

/**
 * 価値観API: 回答保存のリクエスト。
 * 全質問の回答完了時、または途中保存時に送信する。
 */
export type SaveValueAnswersRequest = {
  answers: ValueAnswers;
};

/**
 * Home表示データ: 通常Home画面に表示するレベル、進捗、未完了状態。
 * 現在はダミー表示だが、ユーザーごとに変わるためAPI取得対象にする。
 */
export type HomeDashboardData = {
  level: number;
  levelTitle: string;
  progressPercent: number;
  area: string;
  blockedLevelingIds: ApiId[];
  unansweredValueQuestionIds: ApiId[];
};

/**
 * Home API: ダッシュボード取得のレスポンス。
 * Homeタブの初期表示に使う。
 */
export type HomeDashboardResponse = ApiSuccessResponse<HomeDashboardData>;

/**
 * マッチ相手: メッセージ画面で表示する相手情報。
 * 本アプリでは同時に会話できる相手は1名だけの想定。
 */
export type MatchPartner = {
  id: ApiId;
  name: string;
};

/**
 * メッセージ送信者: 自分の発言か、マッチ相手の発言かを識別する。
 * UIでは自分の発言だけ色付きの吹き出しで表示する。
 */
export type ChatSender = "me" | "partner";

/**
 * メッセージ: 単一チャット画面に表示する1件分のトーク。
 * text は改行を含む可能性があるため、UI側では whitespace-pre-wrap で表示する。
 */
export type ChatMessage = {
  id: ApiId;
  sender: ChatSender;
  text: string;
  time: string;
};

/**
 * メッセージAPI: 現在会話中の相手とトーク履歴の取得レスポンス。
 * 画面遷移時にメッセージタブを初期化するために使う。
 */
export type ChatThreadResponse = ApiSuccessResponse<{
  partner: MatchPartner;
  messages: ChatMessage[];
}>;

/**
 * メッセージAPI: メッセージ送信のリクエスト。
 * Enterは改行のみ、送信ボタン押下時だけこのデータを送る。
 */
export type SendMessageRequest = {
  text: string;
};

/**
 * メッセージAPI: メッセージ送信後のレスポンス。
 * 現状UIでは定型返信を追加するが、将来はバックエンドから保存済みメッセージを返す。
 */
export type SendMessageResponse = ApiSuccessResponse<{
  sentMessage: ChatMessage;
  partnerReply?: ChatMessage;
}>;

/**
 * 設定画面データ: 設定タブに表示するユーザー情報。
 * 現状は登録プロフィールをそのまま表示するが、通知設定などを追加できるよう分けておく。
 */
export type SettingsData = {
  profile: UserProfile;
};

/**
 * 設定API: 設定画面取得のレスポンス。
 * プロフィール編集や通知設定が増えた場合もこの型を拡張する。
 */
export type SettingsResponse = ApiSuccessResponse<SettingsData>;
