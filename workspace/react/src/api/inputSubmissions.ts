import type {
  CompleteRegistrationRequest,
  FeedbackRequest,
  FeedbackResponse,
  LevelingResult,
  SaveLegalConsentRequest,
  SaveValueAnswersRequest,
} from "@/types/api";

/**
 * 現時点のフロントエンド用ダミーAPI。
 * 後日バックエンド統合時は、このファイルの各関数だけを実APIの fetch に置き換える想定。
 *
 * 画面コンポーネントから直接 fetch しないことで、
 * APIパス、HTTPメソッド、リクエスト/レスポンス形式の変更範囲をここに閉じ込める。
 */
function waitForMockNetwork() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 180);
  });
}

/**
 * 規約同意の保存。
 * フロントから送るのは、同意状態と表示していた文書版数のみ。
 * 信頼できる同意日時や保存履歴はサーバー側で記録する前提。
 */
export async function saveLegalConsent(
  request: SaveLegalConsentRequest,
) {
  await waitForMockNetwork();

  return {
    data: {
      accepted: request.consent.privacyPolicyAgreed && request.consent.termsAgreed,
    },
  };
}

/**
 * 初回プロフィール登録。
 * 現在のUIでは、プロフィール登録が完了した時点でHomeへ遷移する。
 * 価値観回答やレベリング結果はこのリクエストには含めず、別タイミングで保存する。
 */
export async function completeRegistration(
  request: CompleteRegistrationRequest,
) {
  await waitForMockNetwork();

  return {
    data: {
      profile: request.profile,
    },
  };
}

/**
 * レベリング結果の保存。
 * フロント側ではスワイプ直後にUIへ反映し、未送信キューで複数件をまとめる。
 * バックエンドAPIが1件単位の場合は、この関数内でAPI仕様に合わせて分割送信できる。
 */
export async function saveLevelingResults(results: LevelingResult[]) {
  await waitForMockNetwork();

  return {
    data: {
      savedItemIds: results.map((result) => result.itemId),
    },
  };
}

/**
 * 価値観回答の保存。
 * 質問数が少ない場合は全問完了時、質問数が増えた場合は数問単位で呼ばれる。
 * answers の key は ValueQuestion.id と一致する。
 */
export async function saveValueAnswers(request: SaveValueAnswersRequest) {
  await waitForMockNetwork();

  return {
    data: {
      savedQuestionIds: Object.keys(request.answers),
    },
  };
}

/**
 * 意見箱の送信。
 * 送信失敗時は画面側で入力内容を保持し、ユーザーが再送できるようにする。
 * feedbackId はバックエンド側の受付IDに置き換える想定。
 */
export async function sendFeedback(
  request: FeedbackRequest,
): Promise<FeedbackResponse> {
  await waitForMockNetwork();

  return {
    data: {
      feedbackId: `feedback-${request.sentAt}`,
    },
  };
}
