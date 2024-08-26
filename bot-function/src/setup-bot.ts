import type { App, KnownBlock, ModalView } from "@slack/bolt";
import type { Config, FillFiledSchema } from "config";
import { asyncClient } from "./async-client.ts";
import * as block from "./block.ts";

export function setupBot(app: App, config: Config): void {
  app.command("/hello", async ({ ack, body, client }) => {
    await ack();
    const modal = createInitialModal(config);
    if (!modal.ok) {
      client.chat.postMessage({
        channel: body.channel_id,
        text: `Error: ${modal.error}`,
      });
    } else {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: modal.view,
      });
    }
  });

  app.view(/\s*/, async ({ ack, body }) => {
    await ack();
    await asyncClient.exec({
      type: "modal_submission",
      payload: body.view,
    });
  });

  app.event(/\s*/, async ({ event }) => {
    console.log("event received: ", event);
  });
}

function createInitialModal(
  config: Config,
): { ok: true; view: ModalView } | { ok: false; error: unknown } {
  try {
    const modalConfig = config.createIncidentModal;
    const modalContent = modalConfig.elements.map((elem) => {
      switch (elem.type) {
        case "fillField": {
          const elementId = `fillField_${elem.field}`;
          const filedSchema = config.getFieldSchema(elem.field);
          return mapElement({ elementId, label: elem.label }, filedSchema);
        }
        case "select":
          return block.selectBlock(elem);
        case "channelSelect":
          return block.channelSelectBlock(elem);
        case "userSelect":
          return block.userSelectBlock(elem);
        case "dateTimePicker":
          return block.dateTimePickerBlock(elem);
        case "radio":
          return block.radio(elem);
        case "checkbox":
          return block.checkbox(elem);
        case "textInput":
          return block.textInput(elem);
        case "header":
          return block.headerBlock(elem);
        case "text":
          return block.text(elem);
        case "note":
          return block.noteBlock(elem);
      }
    });
    return {
      ok: true,
      view: {
        type: "modal",
        title: {
          type: "plain_text",
          text: modalConfig.title,
        },
        blocks: modalContent,
        close: {
          type: "plain_text",
          text: modalConfig.cancel.label,
        },
        submit: {
          type: "plain_text",
          text: modalConfig.submit.label,
        },
        notify_on_close: true,
        callback_id: "create_incident",
      },
    };
  } catch (error) {
    return { ok: false, error };
  }
}

function mapElement(
  elem: { elementId: string; label: string },
  schema: FillFiledSchema,
): KnownBlock {
  switch (schema.type) {
    case "text":
      return block.textInput({
        elementId: elem.elementId,
        type: "textInput",
        label: elem.label,
        placeholder: "placeholder",
        multiline: true,
        optional: false,
      });
    case "number":
      return block.textInput({
        elementId: elem.elementId,
        type: "textInput",
        label: elem.label,
        placeholder: "placeholder",
        multiline: false,
        optional: false,
      });
    case "singleSelect":
      return block.selectBlock({
        elementId: elem.elementId,
        type: "select",
        label: elem.label,
        options: schema.items,
      });
    case "multiSelect":
      return block.multiSelectBlock({
        elementId: elem.elementId,
        type: "select",
        label: elem.label,
        options: schema.items,
      });
    case "user":
      return block.userSelectBlock({
        elementId: elem.elementId,
        type: "userSelect",
        label: elem.label,
      });
  }
}

export function loadEnv(): {
  signingSecret: string;
  token: string;
  configPath: string;
} {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    throw new Error("SLACK_SIGNING_SECRET is not defined");
  }

  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error("SLACK_BOT_TOKEN is not defined");
  }

  const configPath = process.env.CONFIG_PATH ?? "/opt/config.yaml";

  return { signingSecret, token, configPath };
}
