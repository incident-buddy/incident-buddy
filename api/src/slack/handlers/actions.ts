import type { App } from "@slack/bolt";
import { optionalEnv } from "../../env.js";
import { loadConfig, matchRules } from "../../features/incident-config/incident-config.service.js";
import type { Severity } from "../../features/incident/incident.model.js";
import { buildIncidentMessage } from "../../features/incident/incident.presenter.js";
import { incidentRepository } from "../../features/incident/incident.repository.js";
import { incidentService } from "../../features/incident/incident.service.js";
import { createIncidentChannel, inviteToChannel, resolveInvitees } from "./incident-channel.js";
import { postError } from "./post-error.js";

export function registerActionHandlers(app: App): void {
  app.view("create_incident", async ({ ack, body, view, client }) => {
    await ack();

    const meta = JSON.parse(view.private_metadata ?? "{}") as {
      channel_id?: string;
    };
    const channelId = meta.channel_id ?? "";

    try {
      const values = view.state.values;
      const title = values.title?.title_input?.value ?? "";
      const severity = (values.severity?.severity_select?.selected_option?.value ?? "Medium") as Severity;
      const serviceName = values.service?.service_select?.selected_option?.value ?? "";
      const description = values.description?.description_input?.value ?? "";

      const userId = body.user.id;
      const userName = body.user.name;

      const incident = await incidentService.create({
        title,
        description,
        severity,
        serviceName,
        slackChannelId: channelId,
        createdBy: userId,
        createdByName: userName,
      });

      // インシデント対応チャンネルを作成
      const incidentChannel = await createIncidentChannel(client, new Date());

      const message = buildIncidentMessage(incident, { incidentChannelId: incidentChannel.id });
      const result = await client.chat.postMessage({
        channel: channelId,
        ...message,
      });

      await incidentRepository.updateIncidentChannelId(incident.id, incidentChannel.id);
      if (result.ts) {
        await incidentRepository.updateSlackMessageTs(incident.id, result.ts);
      }

      // 通知ルールの評価と追加通知・招待
      const configPath = optionalEnv("INCIDENT_CONFIG_PATH");
      if (!configPath) return;

      const configResult = await loadConfig(configPath);
      if (configResult.type !== "ok") return;

      const matched = matchRules(configResult.config, incident.severity, incident.serviceName);

      // 全マッチルールからメンションを集めて招待対象を解決（重複排除）
      const allMentions = matched.flatMap((r) => r.actions.mentions);
      const invitees = await resolveInvitees(client, allMentions);
      await inviteToChannel(client, incidentChannel.id, invitees);

      for (const rule of matched) {
        for (const channel of rule.actions.channels) {
          const mentionText =
            rule.actions.mentions.length > 0 ? `${rule.actions.mentions.join(" ")} ` : "";
          const channelLink = ` | 対応チャンネル: <#${incidentChannel.id}>`;
          try {
            await client.chat.postMessage({
              channel,
              text: `${mentionText}Incident declared: *${incident.title}* (${incident.severity}${incident.serviceName ? ` / ${incident.serviceName}` : ""})${channelLink}`,
            });
          } catch (e) {
            console.error("[incident-buddy] Failed to post notification:", e);
          }
        }
      }
    } catch (e) {
      await postError(client, channelId, e);
    }
  });
}
