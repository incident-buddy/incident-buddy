import type { Incident, Severity } from "./incident.model.js";

const SEVERITY_COLORS: Record<Severity, string> = {
  P1: "#E53E3E",
  P2: "#DD6B20",
  P3: "#D69E2E",
  P4: "#38A169",
};

export type SlackIncidentMessage = {
  text: string;
  attachments: Array<{
    color: string;
    blocks: unknown[];
  }>;
};

export function buildIncidentMessage(incident: Incident): SlackIncidentMessage {
  const color = SEVERITY_COLORS[incident.severity];
  return {
    text: `Incident Declared: ${incident.title}`,
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
