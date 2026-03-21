type SlackClient = {
  chat: {
    postMessage: (args: { channel: string; text: string }) => Promise<unknown>;
  };
};

/**
 * ハンドラーで発生した例外をチャンネルに公開投稿する。
 *
 * @param client - Slack WebClient (chat.postMessage を持つオブジェクト)
 * @param channelId - 投稿先チャンネル ID
 * @param error - 発生した例外
 */
export async function postError(
  client: SlackClient,
  channelId: string,
  error: unknown,
): Promise<void> {
  if (!channelId) {
    console.error("[incident-buddy] Cannot post error: channelId is empty. Error:", error);
    return;
  }

  const message =
    error instanceof Error ? error.message : "Unknown error";

  try {
    await client.chat.postMessage({
      channel: channelId,
      text: `コマンドの実行に失敗しました\nエラー: ${message}`,
    });
  } catch (e) {
    console.error("[incident-buddy] Failed to post error message:", e);
  }
}
