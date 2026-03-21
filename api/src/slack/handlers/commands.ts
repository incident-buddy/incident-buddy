import type { App } from "@slack/bolt";
import { optionalEnv } from "../../env.js";
import { buildConfigMessage } from "../../features/incident-config/incident-config.presenter.js";
import { loadConfig } from "../../features/incident-config/incident-config.service.js";

export function registerCommandHandlers(app: App): void {
  app.command("/inc", async ({ ack, body, client }) => {
    await ack();

    const configPath = optionalEnv("INCIDENT_CONFIG_PATH");

    // /inc config — 設定確認
    if (body.text === "config") {
      const result = configPath ? await loadConfig(configPath) : null;
      await client.chat.postEphemeral({
        channel: body.channel_id,
        user: body.user_id,
        text: buildConfigMessage(result, configPath),
      });
      return;
    }

    const configResult = configPath ? await loadConfig(configPath) : null;
    const config = configResult?.type === "ok" ? configResult.config : null;

    const severityOptions =
      config && config.severities.length > 0
        ? config.severities.map((s) => ({
            text: {
              type: "plain_text" as const,
              text: s.description ? `${s.label} - ${s.description}` : s.label,
            },
            value: s.label,
          }))
        : [
            { text: { type: "plain_text" as const, text: "Critical" }, value: "Critical" },
            { text: { type: "plain_text" as const, text: "High" }, value: "High" },
            { text: { type: "plain_text" as const, text: "Medium" }, value: "Medium" },
            { text: { type: "plain_text" as const, text: "Low" }, value: "Low" },
          ];

    const serviceOptions =
      config && config.services.length > 0
        ? config.services.map((s) => ({
            text: {
              type: "plain_text" as const,
              text: s.description ? `${s.label} - ${s.description}` : s.label,
            },
            value: s.label,
          }))
        : null;

    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        callback_id: "create_incident",
        private_metadata: JSON.stringify({ channel_id: body.channel_id }),
        title: { type: "plain_text", text: "Declare Incident" },
        submit: { type: "plain_text", text: "Create" },
        close: { type: "plain_text", text: "Cancel" },
        blocks: [
          {
            type: "input",
            block_id: "title",
            label: { type: "plain_text", text: "Title" },
            element: {
              type: "plain_text_input",
              action_id: "title_input",
              placeholder: {
                type: "plain_text",
                text: "Brief description of the incident",
              },
            },
          },
          {
            type: "input",
            block_id: "severity",
            label: { type: "plain_text", text: "Severity" },
            element: {
              type: "static_select",
              action_id: "severity_select",
              placeholder: { type: "plain_text", text: "Select severity" },
              options: severityOptions,
            },
          },
          ...(serviceOptions
            ? [
                {
                  type: "input" as const,
                  block_id: "service",
                  optional: true,
                  label: { type: "plain_text" as const, text: "Service" },
                  element: {
                    type: "static_select" as const,
                    action_id: "service_select",
                    placeholder: { type: "plain_text" as const, text: "Select service (optional)" },
                    options: serviceOptions,
                  },
                },
              ]
            : []),
          {
            type: "input",
            block_id: "description",
            optional: true,
            label: { type: "plain_text", text: "Description" },
            element: {
              type: "plain_text_input",
              action_id: "description_input",
              multiline: true,
              placeholder: {
                type: "plain_text",
                text: "Additional context (optional)",
              },
            },
          },
        ],
      },
    });
  });
}
