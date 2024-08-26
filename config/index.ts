import { readFile } from "node:fs/promises";
import type {
  FillFieldElement,
  ModalConfigElement,
  ModalElement,
  PostElement,
} from "model/ui-element.ts";
import { parse } from "yaml";
import { z } from "zod";
import { CustomField, StdField } from "./field.ts";
import type { StdField as StdFieldType } from "./field.ts";
import {
  ActionListener,
  CreateIncident,
  type CreateIncidentModalConfig,
} from "./flow.ts";
import { Integration } from "./integrations.ts";
import {
  FallbackNotificationPolicy,
  NotificationGroups,
  NotificationPolicies,
} from "./notification.ts";

const ConfigSchema = z.object({
  integration: Integration,
  stdField: StdField,
  customField: CustomField,
  notificationGroups: NotificationGroups,
  createIncident: CreateIncident,
  actionListener: ActionListener,
  notificationPolicies: NotificationPolicies,
  fallbackNotificationPolicy: FallbackNotificationPolicy,
});
type ConfigSchema = z.infer<typeof ConfigSchema>;

export class Config {
  underlying: ConfigSchema;

  private constructor(private input: unknown) {
    const parsed = ConfigSchema.parse(input);
    this.validateFillField(parsed);
    this.underlying = parsed;
  }

  get baseChannelId(): string {
    return this.underlying.integration.slack.baseChannelId;
  }

  get createIncidentModal(): CreateIncidentModalConfig {
    return this.underlying.createIncident.modal;
  }

  get datastoreConfig() {
    return this.underlying.integration.datastore;
  }

  /** get field's metadata specified in config */
  getFieldSchema(field: string): FillFiledSchema {
    const [kind, key] = field.split(".");
    if (!key) {
      throw new Error(`Invalid field format": ${field}`);
    }

    if (isStdFieldKey(key)) {
      const field = this.underlying.stdField[key];
      switch (field.type) {
        case "stdDescription":
          return {
            kind: "std",
            key,
            type: "text",
            label: field.label,
          };
        case "stdStatus":
        case "stdSeverity":
          return {
            kind: "std",
            key,
            type: "singleSelect",
            label: field.label,
            items: field.items,
          };
      }
    }

    const customField = this.underlying.customField[key];
    if (customField) {
      switch (customField.type) {
        case "text":
        case "number":
        case "user":
          return {
            kind: "custom",
            key,
            type: customField.type,
            label: customField.label,
          };
        case "singleSelect":
        case "multiSelect":
          return {
            kind: "custom",
            key,
            type: customField.type,
            label: customField.label,
            items: customField.items,
          };
      }
    }
    throw new Error(`Invalid field kind "${kind}": ${field}`);
  }

  toString(): string {
    return JSON.stringify(this.underlying, null, 2);
  }

  static async load(path: string): Promise<Config> {
    const file = await readFile(path);
    const rawConfig = parse(file.toString("utf-8"));
    return new Config(rawConfig);
  }

  /** validate if `fillField` element refers existing field */
  private validateFillField(config: ConfigSchema) {
    const customFieldNames = Object.keys(config.customField);

    const validate = (elem: FillFieldElement) => {
      const [kind, key] = elem.field.split(".");
      if (kind !== "std" && kind !== "custom") {
        throw new Error(`Invalid field kind "${kind}": ${elem.field}`);
      }
      if (!key) {
        throw new Error(`Invalid field": ${elem.field}`);
      }
      if (kind === "std") {
        if (!isStdFieldKey(key)) {
          throw new Error(
            `Std field "${elem.field}" not found. Available fields: ${Object.keys(StdFieldKeys).join(", ")}`,
          );
        }
      } else if (kind === "custom") {
        if (!customFieldNames.includes(key)) {
          throw new Error(
            `Custom field "${elem.field}" not found. Available fields: ${customFieldNames.join(", ")}`,
          );
        }
      }
    };
    config.createIncident.modal.elements
      .filter(isFillFieldElement)
      .forEach(validate);
  }
}

type StdFieldKey = [keyof StdFieldType][number];
const StdFieldKeys = StdField.keyof();

export function isStdFieldKey(key: string): key is StdFieldKey {
  return StdFieldKeys.safeParse(key).success;
}

function isFillFieldElement(
  elem: ModalConfigElement,
): elem is FillFieldElement {
  return elem.type === "fillField";
}

type StdFillFieldSchema = {
  kind: "std";
  key: StdFieldKey;
  label: string;
} & (
  | { type: "text" }
  | { type: "singleSelect"; items: { code: string; label: string }[] }
);

type CustomFillFieldSchema = {
  kind: "custom";
  key: string;
  label: string;
} & (
  | { type: "text" | "number" | "user" }
  | {
      type: "singleSelect" | "multiSelect";
      items: { code: string; label: string }[];
    }
);

export type FillFiledSchema = StdFillFieldSchema | CustomFillFieldSchema;
