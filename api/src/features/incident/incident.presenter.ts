import type { RoleDef } from "../incident-config/incident-config.model.js";
import type { Incident } from "./incident.model.js";

const DEFAULT_INCIDENT_COLOR = "#718096";
const RESOLVED_INCIDENT_COLOR = "#2EB67D";

/**
 * インシデントの経過時間を人間が読みやすい文字列にフォーマットする
 *
 * @param createdAt - インシデント作成日時
 * @param resolvedAt - インシデント解決日時
 * @returns 60 分未満は `"XX分"`、以降は `"Xh"` / `"Xh YYm"` 形式
 */
export function formatElapsedTime(createdAt: Date, resolvedAt: Date): string {
  const diffMs = resolvedAt.getTime() - createdAt.getTime();
  const totalMinutes = Math.floor(diffMs / 60000);
  if (totalMinutes < 60) return `${totalMinutes}分`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

/**
 * インシデント解決確認モーダルのペイロードを構築する
 *
 * @param incident - 解決対象のインシデント
 * @returns Slack モーダルの定義オブジェクト（`views.open` に渡す）
 */
export function buildResolveConfirmModal(incident: Incident): SlackModal {
  return {
    type: "modal",
    callback_id: "resolve_incident_modal",
    title: { type: "plain_text", text: "インシデントを解決する" },
    submit: { type: "plain_text", text: "解決する" },
    close: { type: "plain_text", text: "キャンセル" },
    private_metadata: JSON.stringify({
      incidentId: incident.id,
      incidentChannelId: incident.incidentChannelId ?? "",
    }),
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: `*${incident.title}*` },
      },
      {
        type: "input",
        block_id: "resolve_note_block",
        optional: true,
        label: { type: "plain_text", text: "解決の説明（任意）" },
        element: {
          type: "plain_text_input",
          action_id: "resolve_note",
          placeholder: { type: "plain_text", text: "例：再起動で解決した" },
        },
      },
    ],
  };
}

/** `chat.postMessage` に渡す Slack メッセージペイロード */
export type SlackMessage = {
  text: string;
  blocks: unknown[];
};

/** `chat.postMessage` に渡すインシデントメッセージペイロード（attachments でカラーバー付き） */
export type SlackIncidentMessage = {
  text: string;
  attachments: Array<{
    color: string;
    blocks: unknown[];
  }>;
};

type PlainText = { type: "plain_text"; text: string };

/** `views.open` に渡す Slack モーダルペイロード */
export type SlackModal = {
  type: "modal";
  callback_id: string;
  title: PlainText;
  submit: PlainText;
  close: PlainText;
  private_metadata: string;
  blocks: unknown[];
};

/**
 * インシデント対応チャンネルに投稿するウェルカムメッセージを構築する
 *
 * @description インシデントの現在の状態に応じてブロックを切り替える:
 * - `open` 時: ロールアサインボタン（設定がある場合）と解決ボタンを表示
 * - `resolved` 時: 解決者・解決日時・経過時間を表示
 * @param incident - ウェルカムメッセージの元となるインシデント情報
 * @param roles - ロールアサインボタンの定義一覧（省略時は空配列）
 * @returns `chat.postMessage` / `chat.update` に渡す Slack メッセージペイロード
 */
export function buildChannelWelcomeMessage(
  incident: Incident,
  roles: RoleDef[] = [],
): SlackMessage {
  const fields: unknown[] = [
    { type: "mrkdwn", text: `*Severity*\n${incident.severity}` },
    { type: "mrkdwn", text: `*Declared by*\n${incident.createdByName}` },
  ];
  if (incident.serviceName) {
    fields.push({ type: "mrkdwn", text: `*Service*\n${incident.serviceName}` });
  }

  const blocks: unknown[] = [
    {
      type: "section",
      text: { type: "mrkdwn", text: `*🚨 ${incident.title}*` },
    },
    { type: "section", fields },
  ];

  if (incident.description) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: incident.description },
    });
  }

  // 担当者一覧
  if (incident.responders.length > 0) {
    const responderLines = incident.responders
      .map((r) => {
        const role = roles.find((ro) => ro.id === r.roleId);
        const roleLabel = role ? role.label : r.roleId;
        return `• ${roleLabel}: @${r.userName}`;
      })
      .join("\n");
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*担当者*\n${responderLines}` },
    });
  }

  if (incident.status === "resolved") {
    const elapsed =
      incident.resolvedAt
        ? formatElapsedTime(incident.createdAt, incident.resolvedAt)
        : "";
    const resolvedDate = incident.resolvedAt
      ? incident.resolvedAt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
      : "";
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `✅ *解決済み*\n解決者: @${incident.resolvedByName ?? "不明"} | 解決日時: ${resolvedDate} | 経過時間: ${elapsed}`,
      },
    });
  } else {
    // ロールアサインボタン
    if (roles.length > 0) {
      const buttons = roles.map((role) => ({
        type: "button",
        text: { type: "plain_text", text: `${role.label}になる` },
        action_id: `assign_role_${role.id}`,
        value: role.id,
      }));
      blocks.push({
        type: "actions",
        block_id: "role_buttons",
        elements: buttons,
      });
    }

    // 解決ボタン
    blocks.push({
      type: "actions",
      block_id: "resolve_buttons",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "インシデントを解決する" },
          action_id: "resolve_incident",
          style: "danger",
          value: "resolve",
        },
      ],
    });
  }

  return {
    text: `Incident: ${incident.title}`,
    blocks,
  };
}

/**
 * インシデント宣言元チャンネルに投稿するインシデントメッセージを構築する
 *
 * @description ステータスに応じてカラーバー・テキストを切り替える:
 * - `open` 時: グレー、`<!here>` で確認を促す
 * - `resolved` 時: グリーン、解決日時と経過時間を表示
 * @param incident - メッセージの元となるインシデント情報
 * @param options.incidentChannelId - インシデント対応チャンネルの ID（指定時はリンクを付与）
 * @returns `chat.postMessage` / `chat.update` に渡す Slack メッセージペイロード
 */
export function buildIncidentMessage({
  incident,
  options,
}: {
  incident: Incident;
  options?: { incidentChannelId?: string };
}): SlackIncidentMessage {
  const isResolved = incident.status === "resolved";
  const color = isResolved ? RESOLVED_INCIDENT_COLOR : DEFAULT_INCIDENT_COLOR;
  const channelLink = options?.incidentChannelId
    ? ` | 対応チャンネル: <#${options.incidentChannelId}>`
    : "";

  const statusText = isResolved
    ? `✅ RESOLVED by ${incident.resolvedByName ?? "不明"}`
    : incident.status;

  const blocks: unknown[] = [
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Incident ID*\n${incident.id}` },
        { type: "mrkdwn", text: `*Severity*\n${incident.severity}` },
        {
          type: "mrkdwn",
          text: `*Declared by*\n<@${incident.createdBy}>`,
        },
        { type: "mrkdwn", text: `*Status*\n${statusText}` },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${incident.title}*${incident.description ? `\n${incident.description}` : ""}`,
      },
    },
  ];

  if (!isResolved) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "<!here> Please acknowledge in this thread.",
      },
    });
  }

  if (isResolved && incident.resolvedAt) {
    const elapsed = formatElapsedTime(incident.createdAt, incident.resolvedAt);
    const resolvedDate = incident.resolvedAt.toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
    });
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `解決日時: ${resolvedDate} | 経過時間: ${elapsed}`,
      },
    });
  }

  return {
    text: `Incident ${isResolved ? "Resolved" : "Declared"}: ${incident.title}${channelLink}`,
    attachments: [{ color, blocks }],
  };
}

/**
 * `/inc list` コマンドの応答メッセージ（オープン中インシデント一覧）を構築する
 *
 * @description 純粋関数。副作用なし。`now` を引数で受け取ることでテスタブルに保つ。
 * 0件のときは「オープン中のインシデントはありません」を返す。
 * @param incidents - オープン中インシデントの一覧（作成日時降順を想定）
 * @param now - 経過時間計算の基準となる現在時刻
 * @returns `respond()` に渡す Slack メッセージペイロード（mrkdwn 形式）
 */
export function buildIncidentListMessage(incidents: Incident[], now: Date): SlackMessage {
  if (incidents.length === 0) {
    return { text: "オープン中のインシデントはありません", blocks: [] };
  }

  const blocks: unknown[] = [
    {
      type: "section",
      text: { type: "mrkdwn", text: `*オープン中のインシデント (${incidents.length}件)*` },
    },
    { type: "divider" },
  ];

  for (const incident of incidents) {
    const elapsed = formatElapsedTime(incident.createdAt, now);
    const channelLink = incident.incidentChannelId ? ` <#${incident.incidentChannelId}>` : "";
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: [
          `*${incident.title}*`,
          `Severity: ${incident.severity} | Declared by: ${incident.createdByName} | 経過: ${elapsed}${channelLink}`,
        ].join("\n"),
      },
    });
  }

  const textSummary = incidents
    .map((i) => {
      const elapsed = formatElapsedTime(i.createdAt, now);
      const channelLink = i.incidentChannelId ? ` <#${i.incidentChannelId}>` : "";
      return `• ${i.title} [${i.severity}] ${i.createdByName} 経過:${elapsed}${channelLink}`;
    })
    .join("\n");

  return {
    text: `オープン中のインシデント (${incidents.length}件)\n${textSummary}`,
    blocks,
  };
}
