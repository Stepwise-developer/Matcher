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
 * fields はフォーム項目単位のエラー表示に使う想定。
 */
export type ApiErrorResponse = {
  error: {
    /** 機械判定用のエラーコード。例: validation_error, unauthorized */
    code: string;
    /** 画面に表示できる短いエラーメッセージ。 */
    message: string;
    /** 項目名ごとのエラー。key はフロントのフォーム項目名と揃える。 */
    fields?: Record<string, string>;
  };
};

/**
 * ユーザー基本情報: 初回登録フォームで入力するプロフィール。
 * マッチング、設定表示、候補表示の条件として保存する。
 */
export type UserProfile = {
  /** 表示名。ログインIDではなく、画面表示用の名前。 */
  name: string;
  /** 年齢。現状UIではセレクト値を文字列で保持する。 */
  age: string;
  /** 性別。選択肢はフロントの定義とバックエンド側マスタで揃える。 */
  gender: string;
  /** 身長cm。現状UIでは入力値を文字列で保持し、送信前に範囲チェックする。 */
  height: string;
  /** 体重kg。現状UIでは入力値を文字列で保持し、送信前に範囲チェックする。 */
  weight: string;
  /** 活動エリア。現在は関東圏の都道府県のみ。 */
  area: string;
  /** 首都圏の沿線。将来的には路線マスタIDへの置き換え候補。 */
  trainLine: string;
};

/**
 * ユーザー登録状態: 初回登録完了後に保存するオンボーディング結果。
 * 現状は localStorage に保存しているが、バックエンド統合後はユーザー状態APIで管理する。
 * 初回登録ではプロフィールだけを確定し、価値観質問とレベリングはHome表示後に進める。
 */
export type RegistrationData = {
  /** 登録済みプロフィール。設定画面やHome表示の基礎データ。 */
  profile: UserProfile;
  /** 価値観質問の回答。未回答時は空オブジェクトを許容する。 */
  values: ValueAnswers;
  /** 価値観質問が完了済みかどうか。メッセージ解放条件に使う。 */
  valuesCompleted: boolean;
  /** 未達成のレベリング項目ID。空配列になるとレベリング完了扱い。 */
  blockedLevelingIds: ApiId[];
  /** 初回プロフィール登録が完了した日時。ISO 8601 形式を想定。 */
  completedAt: ApiDateTime;
};

/**
 * 規約同意: 初回登録前に確認する利用規約・プライバシーポリシーの同意状態。
 * 画面では両方を開いてからチェック可能にし、表示中の文書版数と同意状態を送る。
 * 信頼できる同意日時はサーバー側で記録する前提にする。
 */
export type LegalConsent = {
  /** プライバシーポリシーに同意したか。 */
  privacyPolicyAgreed: boolean;
  /** フロントが表示したプライバシーポリシーの版数または文書ID。 */
  privacyPolicyVersion: string;
  /** 利用規約に同意したか。 */
  termsAgreed: boolean;
  /** フロントが表示した利用規約の版数または文書ID。 */
  termsVersion: string;
};

/**
 * 規約同意API: 初回登録の最初に同意内容を保存する時のリクエスト。
 * プロフィール登録とは分け、同意履歴を独立して管理できるようにする。
 */
export type SaveLegalConsentRequest = {
  consent: LegalConsent;
};

/**
 * ユーザー登録API: 初回プロフィール登録を完了させる時に送信するデータ。
 * 現在のUIでは個人情報の登録だけでHomeへ進み、価値観質問とレベリングは後続タブで進める。
 */
export type CompleteRegistrationRequest = {
  /** 初回登録時に確定するプロフィール。レベリングや価値観回答は含めない。 */
  profile: UserProfile;
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
  /** レベリング項目のID。ユーザー達成状態ではこのIDを参照する。 */
  id: ApiId;
  /** カードや一覧に表示する短い見出し。 */
  title: string;
  /** 項目の説明本文。 */
  body: string;
  /** 達成済みと判断するための基準。 */
  criteria: string;
};

/**
 * レベリング判定: ユーザーが項目を達成済みかどうかを記録する結果。
 * 初回登録の左右スワイプや、未達成項目の回収で利用する。
 */
export type LevelingResult = {
  /** 判定対象のレベリング項目ID。 */
  itemId: ApiId;
  /** true なら達成、false なら未達成。 */
  achieved: boolean;
  /** フロントで判定操作を行った日時。保存時刻はサーバー側でも別途持てる。 */
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
  /** 質問ID。回答保存時の key として利用する。 */
  id: ApiId;
  /** 質問タイトル。 */
  title: string;
  /** 質問本文または補足説明。 */
  body: string;
};

/**
 * 価値観質問: 並べ替え式。
 * options の数は質問ごとに変えられ、回答では配列の先頭ほど優先度が高いものとして扱う。
 */
export type RankingValueQuestion = ValueQuestionBase & {
  type: "ranking";
  /** 並べ替える選択肢。配列順は初期表示順。 */
  options: string[];
};

/**
 * 価値観質問: チェックボックス式。
 * minSelections / maxSelections により、選択数の制約を質問ごとに設定できる。
 */
export type CheckboxValueQuestion = ValueQuestionBase & {
  type: "checkbox";
  /** チェックボックスの選択肢。質問ごとに数は可変。 */
  options: string[];
  /** 最低選択数。未指定時はフロント側で1として扱う。 */
  minSelections?: number;
  /** 最大選択数。未指定時は選択肢数まで選択可能として扱う。 */
  maxSelections?: number;
};

/**
 * 価値観質問: 自由記述式。
 * minLength / maxLength により、文字数の制約を質問ごとに設定できる。
 */
export type TextValueQuestion = ValueQuestionBase & {
  type: "text";
  /** 最低文字数。未指定時はフロント側で1として扱う。 */
  minLength?: number;
  /** 最大文字数。未指定時はフロント側で既定値を使う。 */
  maxLength?: number;
  /** 入力欄に表示する例文。 */
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
  /** 優先順位。配列の先頭ほど優先度が高い。 */
  order: string[];
};

/**
 * 価値観回答: チェックボックス式の回答。
 * selected にユーザーが選んだ選択肢を保存する。
 */
export type CheckboxValueAnswer = {
  type: "checkbox";
  /** 選択済みの選択肢。 */
  selected: string[];
};

/**
 * 価値観回答: 自由記述式の回答。
 * text にユーザーの入力内容を保存する。
 */
export type TextValueAnswer = {
  type: "text";
  /** 自由記述の回答本文。localStorage には保存しない方針。 */
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
  /** key は ValueQuestion.id。value は質問typeに対応する回答。 */
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
  /** 現在のユーザーレベル。 */
  level: number;
  /** レベル名や状態名。 */
  levelTitle: string;
  /** 進捗率。0-100の数値を想定。 */
  progressPercent: number;
  /** Homeで表示する主な活動エリア。 */
  area: string;
  /** 未達成レベリング項目ID。 */
  blockedLevelingIds: ApiId[];
  /** 未回答の価値観質問ID。 */
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
  /** マッチ相手ID。 */
  id: ApiId;
  /** 画面表示名。 */
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
  /** メッセージID。フロントの仮IDからDB採番IDへ置き換え可能。 */
  id: ApiId;
  /** 自分の発言か相手の発言か。 */
  sender: ChatSender;
  /** メッセージ本文。改行を含む可能性がある。 */
  text: string;
  /** 表示用時刻。バックエンド統合時は送信日時と表示形式を分けてもよい。 */
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
  /** 送信するメッセージ本文。Enterでは送信せず、送信ボタン押下時だけ送る。 */
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
  /** 設定画面で表示する登録プロフィール。 */
  profile: UserProfile;
};

/**
 * 設定API: 設定画面取得のレスポンス。
 * プロフィール編集や通知設定が増えた場合もこの型を拡張する。
 */
export type SettingsResponse = ApiSuccessResponse<SettingsData>;

/**
 * フィードバックAPI: 設定内の意見箱から送信する内容。
 * 任意で画面名や送信時刻を持たせ、後から改善対象を追いやすくする。
 */
export type FeedbackRequest = {
  /** 意見箱の本文。送信失敗時はフロント側state/sessionStorageに保持する。 */
  message: string;
  /** 送信元画面。例: settings */
  screen?: string;
  /** フロントで送信操作を行った時刻。受付時刻はサーバー側でも記録する想定。 */
  sentAt: ApiDateTime;
};

/**
 * フィードバックAPI: 意見箱の送信結果。
 * 受け付けたフィードバックIDを返し、問い合わせや管理画面で追跡できるようにする。
 */
export type FeedbackResponse = ApiSuccessResponse<{
  feedbackId: ApiId;
}>;
