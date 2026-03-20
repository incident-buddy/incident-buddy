import type { App } from "@slack/bolt";

export function registerCommandHandlers(app: App): void {
  app.command("/inc", async ({ ack, body, client }) => {
    await ack();

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
              options: [
                {
                  text: { type: "plain_text", text: "P1 - Critical" },
                  value: "P1",
                },
                {
                  text: { type: "plain_text", text: "P2 - High" },
                  value: "P2",
                },
                {
                  text: { type: "plain_text", text: "P3 - Medium" },
                  value: "P3",
                },
                {
                  text: { type: "plain_text", text: "P4 - Low" },
                  value: "P4",
                },
              ],
            },
          },
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
