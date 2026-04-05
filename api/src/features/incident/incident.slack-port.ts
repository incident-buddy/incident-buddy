import type { RoleDef } from "../incident-config/incident-config.model.js";
import type { Incident } from "./incident.model.js";

/**
 * サービス層が Slack I/O を要求するための Port インターフェース
 *
 * @description Ports & Adapters パターンにおける Port 定義。
 * サービス層はこのインターフェースを通じて Slack I/O を行い、
 * 具体的な Slack SDK への依存を持たない。
 * 実装（Adapter）は `slack/handlers/actions.ts` の `makeSlackAdapter` が提供する。
 */
export interface IncidentSlackPort {
  /**
   * インシデント対応用の Slack チャンネルを作成する
   *
   * @param date - チャンネル名の生成に使用する日付
   * @returns 作成したチャンネルの ID
   */
  createChannel(date: Date): Promise<{ id: string }>;

  /**
   * インシデント宣言元チャンネルにインシデントメッセージを投稿する
   *
   * @param channelId - 投稿先チャンネル ID（宣言元）
   * @param incident - 投稿内容の生成に使用するインシデント情報
   * @param incidentChannelId - メッセージに含めるインシデント対応チャンネルの ID
   * @returns 投稿したメッセージのタイムスタンプ
   */
  postIncidentMessage(
    channelId: string,
    incident: Incident,
    incidentChannelId: string,
  ): Promise<{ ts: string }>;

  /**
   * インシデント対応チャンネルにウェルカムメッセージを投稿する
   *
   * @param channelId - 投稿先チャンネル ID（インシデント対応チャンネル）
   * @param incident - 投稿内容の生成に使用するインシデント情報
   * @param roles - ウェルカムメッセージに含めるロールボタンの定義
   * @returns 投稿したメッセージのタイムスタンプ
   */
  postWelcomeMessage(
    channelId: string,
    incident: Incident,
    roles: RoleDef[],
  ): Promise<{ ts: string }>;

	/**
	 * TODO
	 */
	setTopic(
    channelId: string,
    incident: Incident,
  ): Promise<void>;

  /**
   * インシデント宣言元チャンネルの Slack メッセージを最新状態に更新する
   *
   * @param incident - 更新に使用するインシデント情報
   */
  refreshIncidentMessage(incident: Incident): Promise<void>;

  /**
   * メンション対象ユーザーをチャンネルに招待し、招待通知を投稿する
   *
   * @param channelId - 招待先チャンネル ID
   * @param mentions - 招待対象のメンション文字列一覧（例: `@here`, `@UXXXXXXX`）
   */
  inviteAndNotify(channelId: string, mentions: string[]): Promise<void>;

  /**
   * インシデント解決後の Slack 後処理を実行する（best-effort）
   *
   * @description ウェルカムメッセージの更新・インシデントメッセージの更新・
   * 解決通知の投稿を行う。各操作が失敗してもエラーを伝播させずログのみ出力する。
   * @param incident - 解決済みのインシデント情報
   */
  onResolved(incident: Incident): Promise<void>;
}
