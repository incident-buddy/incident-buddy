import type { RoleDef } from "../incident-config/incident-config.model.js";
import type { Incident } from "./incident.model.js";

const DEFAULT_INCIDENT_COLOR = "#718096";

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
  const color = DEFAULT_INCIDENT_COLOR;
  const channelLink = options?.incidentChannelId
    ? ` | 対応チャンネル: <#${options.incidentChannelId}>`
    : "";
  return {
    text: `Incident Declared: ${incident.title}${channelLink}`,
    attachments: [
      {
        color,
        blocks: [
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Incident ID*\n${incident.id}` },
              { type: "mrkdwn", text: `*Severity*\n${incident.severity}` },
              {
                type: "mrkdwn",
                text: `*Declared by*\n<@${incident.createdBy}>`,
              },
              { type: "mrkdwn", text: `*Status*\n${incident.status}` },
            ],
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${incident.title}*${incident.description ? `\n${incident.description}` : ""}`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "<!here> Please acknowledge in this thread.",
            },
          },
        ],
      },
    ],
  };
}
