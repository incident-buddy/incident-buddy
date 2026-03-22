import type { RoleDef } from "../incident-config/incident-config.model.js";
import type { Incident } from "./incident.model.js";

const DEFAULT_INCIDENT_COLOR = "#718096";
const RESOLVED_INCIDENT_COLOR = "#2EB67D";

export function formatElapsedTime(createdAt: Date, resolvedAt: Date): string {
  const diffMs = resolvedAt.getTime() - createdAt.getTime();
  const totalMinutes = Math.floor(diffMs / 60000);
  if (totalMinutes < 60) return `${totalMinutes}分`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

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

export type SlackMessage = {
  text: string;
  blocks: unknown[];
};

export type SlackIncidentMessage = {
  text: string;
  attachments: Array<{
    color: string;
    blocks: unknown[];
  }>;
};

type PlainText = { type: "plain_text"; text: string };

export type SlackModal = {
  type: "modal";
  callback_id: string;
  title: PlainText;
  submit: PlainText;
  close: PlainText;
  private_metadata: string;
  blocks: unknown[];
};

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
