import { membersCol } from "../../db/firestore.js";
import { withSpan } from "../../telemetry.js";

export const memberRepository = {
  /**
   * Slack ユーザーをメンバーとして登録、または表示名を更新する
   *
   * @description `merge: true` による upsert のため、ドキュメントが存在しない場合は新規作成し、
   * 存在する場合は `displayName` のみを上書きする。
   * インシデント宣言・レスポンダーアサイン時に呼び出して最新の表示名を保持する。
   * @param slackUserId - Slack ユーザー ID（ドキュメント ID として使用）
   * @param displayName - Slack 表示名
   */
  async upsert(slackUserId: string, displayName: string): Promise<void> {
    return withSpan("member.repository.upsert", { collection: "members", operation: "upsert" }, async () => {
      await membersCol
        .doc(slackUserId)
        .set({ slackUserId, displayName }, { merge: true });
    });
  },
};
