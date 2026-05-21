import type { ValueAnswers } from "@/types/api";

/**
 * 送信状態のUI管理用ステータス。
 * バックエンドのDB状態ではなく、フロントエンド内の操作状態を表す。
 */
export type SubmitStatus = "idle" | "dirty" | "saving" | "saved" | "error";

/**
 * 入力キャッシュと一括送信のデフォルト値。
 * 質問数や項目数が増えた場合に調整できるよう、画面内に直書きせずここへ集約する。
 */
export const inputCacheDefaults = {
  /** 意見箱の下書きを sessionStorage に短期保存する。 */
  feedbackDraftEnabled: true,
  /** 意見箱の下書きは最大1件だけ保持する。 */
  feedbackDraftLimit: 1,
  /** レベリング結果をまとめて送信する件数。 */
  levelingFlushItemCount: 3,
  /** 現在のプロフィール登録は単一画面のため下書き保存しない。 */
  profileDraftEnabled: false,
  /** 価値観回答はリロード復元用に sessionStorage へ短期保存する。 */
  valuesDraftEnabled: true,
  /** 価値観回答を数問単位で送る場合の目安。現状は全5問なので完了時送信と同じ。 */
  valuesFlushQuestionCount: 5,
} as const;

/**
 * sessionStorage のキー。
 * localStorage には個人情報・自由記述・価値観回答を保存しない方針。
 */
const draftKeys = {
  feedback: "omatcha-draft-feedback-v1",
  values: "omatcha-draft-values-v1",
} as const;

function canUseSessionStorage() {
  return typeof window !== "undefined" && Boolean(window.sessionStorage);
}

function readJsonDraft<TValue>(key: string): TValue | null {
  if (!canUseSessionStorage()) {
    return null;
  }

  const saved = window.sessionStorage.getItem(key);

  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved) as TValue;
  } catch {
    window.sessionStorage.removeItem(key);
    return null;
  }
}

function writeJsonDraft<TValue>(key: string, value: TValue) {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(key, JSON.stringify(value));
}

export function readValueAnswersDraft() {
  return readJsonDraft<ValueAnswers>(draftKeys.values);
}

/**
 * 価値観回答の下書き保存。
 * 送信成功、登録完了、入力破棄時には clearValueAnswersDraft で削除する。
 */
export function writeValueAnswersDraft(values: ValueAnswers) {
  if (!inputCacheDefaults.valuesDraftEnabled) {
    return;
  }

  writeJsonDraft(draftKeys.values, values);
}

export function clearValueAnswersDraft() {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(draftKeys.values);
}

export function readFeedbackDraft() {
  return readJsonDraft<{ message: string }>(draftKeys.feedback);
}

/**
 * 意見箱の下書き保存。
 * 最大1件の短期復元用であり、送信成功後は削除する。
 */
export function writeFeedbackDraft(message: string) {
  if (!inputCacheDefaults.feedbackDraftEnabled) {
    return;
  }

  writeJsonDraft(draftKeys.feedback, { message });
}

export function clearFeedbackDraft() {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(draftKeys.feedback);
}

export function clearAllInputDrafts() {
  clearFeedbackDraft();
  clearValueAnswersDraft();
}
