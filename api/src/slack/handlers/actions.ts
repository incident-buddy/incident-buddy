import type { App } from "@slack/bolt";
import type { Severity } from "../../features/incident/incident.model.js";
import { buildIncidentMessage } from "../../features/incident/incident.presenter.js";
import { incidentRepository } from "../../features/incident/incident.repository.js";
import { incidentService } from "../../features/incident/incident.service.js";

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

    const incident = await incidentService.create({
      title,
      description,
      severity,
      slackChannelId: channelId,
      createdBy: userId,
      createdByName: userName,
    });

    const message = buildIncidentMessage(incident);
    const result = await client.chat.postMessage({
      channel: channelId,
      ...message,
    });

    if (result.ts) {
      await incidentRepository.updateSlackMessageTs(incident.id, result.ts);
    }
  });
}
