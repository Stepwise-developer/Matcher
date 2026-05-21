import type { LevelingResult } from "@/types/api";

/**
 * レベリング結果の未送信キュー。
 * スワイプ直後にUIへ反映しつつ、バックエンド送信はまとまりごとに行うための一時保存。
 */
const levelingQueueKey = "omatcha-pending-leveling-v1";

function canUseSessionStorage() {
  return typeof window !== "undefined" && Boolean(window.sessionStorage);
}

export function readPendingLevelingResults() {
  if (!canUseSessionStorage()) {
    return [];
  }

  const saved = window.sessionStorage.getItem(levelingQueueKey);

  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved) as LevelingResult[];
  } catch {
    window.sessionStorage.removeItem(levelingQueueKey);
    return [];
  }
}

export function writePendingLevelingResults(results: LevelingResult[]) {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(levelingQueueKey, JSON.stringify(results));
}

/**
 * 未送信キューへレベリング結果を追加する。
 * 同じ itemId が複数回入る場合は最新状態を優先し、重複送信を抑える。
 */
export function mergePendingLevelingResult(result: LevelingResult) {
  const currentResults = readPendingLevelingResults();
  const nextResults = [
    ...currentResults.filter((item) => item.itemId !== result.itemId),
    result,
  ];

  writePendingLevelingResults(nextResults);

  return nextResults;
}

/**
 * 送信成功したレベリング結果を未送信キューから削除する。
 * itemIds 未指定時はキュー全体を削除する。
 */
export function clearPendingLevelingResults(itemIds?: string[]) {
  if (!canUseSessionStorage()) {
    return;
  }

  if (!itemIds) {
    window.sessionStorage.removeItem(levelingQueueKey);
    return;
  }

  const remainingResults = readPendingLevelingResults().filter(
    (result) => !itemIds.includes(result.itemId),
  );

  if (remainingResults.length > 0) {
    writePendingLevelingResults(remainingResults);
    return;
  }

  window.sessionStorage.removeItem(levelingQueueKey);
}
