import type { App, ModalView } from "@slack/bolt";
import type { Config } from "config";
import type { CreateIncidentModalConfig } from "config/flow.ts";
import type { TextInputElement } from "model/ui-element.ts";
import * as block from "./block.ts";

export function setupBot(app: App, config: Config): void {
  app.command("/hello", async ({ ack, body, client }) => {
    await ack();
    const view = toModalView(config.createIncidentModal);
    await client.views.open({ trigger_id: body.trigger_id, view });
  });
}

function toModalView(config: CreateIncidentModalConfig): ModalView {
  const modalContent = config.elements.map((elem) => {
    switch (elem.type) {
      case "fillField": {
        const resolved = {
          elementId: elem.field,
          type: "textInput",
          label: elem.label,
          placeholder: "placeholder",
          multiline: false,
          optional: false,
        };
        // TODO use appropriate element type based on field type
        // e.g. description should be a textarea
        // e.g. severity should be a select
        return block.textInput(resolved as TextInputElement);
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
    type: "modal",
    title: {
      type: "plain_text",
      text: config.title,
    },
    blocks: modalContent,
    close: {
      type: "plain_text",
      text: config.cancel?.label,
    },
    submit: {
      type: "plain_text",
      text: config.submit.label,
    },
    notify_on_close: true,
    callback_id: "create_incident",
  };
}
