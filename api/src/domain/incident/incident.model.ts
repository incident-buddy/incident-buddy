/** インシデントの現在の状態。`open` = 対応中、`resolved` = 解決済み */
export type IncidentStatus = "open" | "resolved";

/** severity ラベルの文字列エイリアス（設定ファイル定義の値をそのまま使う） */
export type Severity = string;

/**
 * タイムラインイベントの種別
 *
 * - `created` — インシデントが宣言された
 * - `responder_added` — レスポンダーがアサインされた
 * - `service_added` — 対象サービスが追加された
 * - `resolved` — インシデントが解決された
 * - `note` — 任意メモが記録された
 */
export type TimelineEventType =
  | "created"
  | "responder_added"
  | "service_added"
  | "resolved"
  | "note";

/** インシデントにアサインされたレスポンダー（担当者）情報 */
export type Responder = {
  /** アサインされたロールの ID（設定ファイルの `roles[].id`） */
  roleId: string;
  /** Slack ユーザー ID */
  userId: string;
  /** Slack 表示名 */
  userName: string;
};

/** インシデントのドメインモデル */
export type Incident = {
  /** ドキュメント ID（ULID） */
  readonly id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  severity: Severity;
  serviceName: string;
  /** インシデントが宣言された Slack チャンネルの ID */
  slackChannelId: string;
  /** 宣言チャンネルに投稿したインシデントメッセージのタイムスタンプ */
  slackMessageTs: string;
  /** 自動作成されたインシデント対応チャンネルの ID */
  incidentChannelId?: string;
  /** インシデント対応チャンネルに投稿したウェルカムメッセージのタイムスタンプ */
  welcomeMessageTs?: string;
  /** 宣言者の Slack ユーザー ID */
  createdBy: string;
  /** 宣言者の Slack 表示名 */
  createdByName: string;
  teamIds: string[];
  serviceIds: string[];
  responders: Responder[];
  createdAt: Date;
  resolvedAt: Date | null;
  /** 解決操作を行ったユーザーの Slack ユーザー ID */
  resolvedBy: string | null;
  /** 解決操作を行ったユーザーの Slack 表示名 */
  resolvedByName: string | null;
  updatedAt: Date;
};

/** すでに解決済みのインシデントを再度解決しようとした場合にスローされるエラー */
export class AlreadyResolvedError extends Error {
  constructor() {
    super("このインシデントはすでに解決済みです");
    this.name = "AlreadyResolvedError";
  }
}

/** `incidentService.open` に渡すインシデント作成パラメーター */
export type CreateIncidentParams = {
  title: string;
  description: string;
  severity: Severity;
  serviceName: string;
  /** インシデントが宣言された Slack チャンネルの ID */
  slackChannelId: string;
  /** 宣言者の Slack ユーザー ID */
  createdBy: string;
  /** 宣言者の Slack 表示名 */
  createdByName: string;
};
