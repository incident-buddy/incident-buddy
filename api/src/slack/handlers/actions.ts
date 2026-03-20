import type { App } from "@slack/bolt";
import { membersCol } from "../../db/firestore.js";
import type { Severity } from "../../db/types.js";
import { incidentRepository } from "../../features/incident/incident.repository.js";

const SEVERITY_COLORS: Record<Severity, string> = {
  P1: "#E53E3E",
  P2: "#DD6B20",
  P3: "#D69E2E",
  P4: "#38A169",
};

export function registerActionHandlers(app: App): void {
  app.view("create_incident", async ({ ack, body, view, client }) => {
    await ack();

    const values = view.state.values;
    const title = values.title?.title_input?.value ?? "";
    const severity = (values.severity?.severity_select?.selected_option
      ?.value ?? "P3") as Severity;
    const description = values.description?.description_input?.value ?? "";

    const meta = JSON.parse(view.private_metadata ?? "{}") as {
      channel_id?: string;
    };
    const channelId = meta.channel_id ?? "";

    const userId = body.user.id;
    const userName = body.user.name;

    // メンバー情報を upsert (Slack userId をドキュメント ID として使う)
    await membersCol.doc(userId).set(
      {
        slackUserId: userId,
        displayName: userName,
        avatarUrl: "",
        teamIds: [],
      },
      { merge: true },
    );

    const incident = await incidentRepository.create({
      title,
      description,
      severity,
      slackChannelId: channelId,
      slackMessageTs: "",
      createdBy: userId,
      createdByName: userName,
      teamIds: [],
      serviceIds: [],
      responderIds: [],
    });

    const color = SEVERITY_COLORS[incident.severity];

    const result = await client.chat.postMessage({
      channel: channelId,
      text: `Incident Declared: ${title}`,
      attachments: [
        {
          color,
          blocks: [
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Incident ID*\n${incident.id}`,
                },
                {
                  type: "mrkdwn",
                  text: `*Severity*\n${incident.severity}`,
                },
                {
                  type: "mrkdwn",
                  text: `*Declared by*\n<@${userId}>`,
                },
                {
                  type: "mrkdwn",
                  text: `*Status*\n${incident.status}`,
                },
              ],
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*${title}*${description ? `\n${description}` : ""}`,
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
    });

    if (result.ts) {
      await incidentRepository.updateSlackMessageTs(incident.id, result.ts);
    }
  });
}
