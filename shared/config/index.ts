import { readFile } from "node:fs/promises";
import type { FillFieldElement } from "model/ui-element";
import { parse } from "yaml";
import { z } from "zod";
import { CustomField, StdField } from "./field";
import { ActionListener, CreateIncident } from "./flow";
import { Integration } from "./integrations";
import {
  FallbackNotificationPolicy,
  NotificationGroups,
  NotificationPolicies,
} from "./notification";
import type { CreateIncidentStep, Step } from "./steps";

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
  private _config: ConfigSchema;
  private constructor(private input: unknown) {
    const parsed = ConfigSchema.parse(input);
    this.validateFillField(parsed);
    this._config = parsed;
  }

  static async load(path: string): Promise<Config> {
    console.log("path", path);
    const file = await readFile(path);
    const rawConfig = parse(file.toString("utf-8"));
    return new Config(rawConfig);
  }

  /** validate if `fillField` element refers existing field */
  private validateFillField(config: ConfigSchema): void {
    const stdFieldNames = Object.keys(config.stdField);
    const customFieldNames = Object.keys(config.customField);

    const validate = (elem: FillFieldElement) => {
      const [kind, key] = elem.field.split(".");
      if (kind !== "std" && kind !== "custom") {
        throw new Error(`Invalid field kind "${kind}": ${elem.field}`);
      }
      if (kind === "std") {
        if (!stdFieldNames.includes(key)) {
          throw new Error(
            `Std field "${elem.field}" not found. Available std fields: ${stdFieldNames.join(
              ", ",
            )}`,
          );
        }
      } else if (kind === "custom") {
        if (!customFieldNames.includes(key)) {
          throw new Error(
            `Custom field "${elem.field}" not found. Available custom fields: ${customFieldNames.join(
              ", ",
            )}`,
          );
        }
      }

      return {
        ...elem,
        kind,
        key,
      };
    };

    const fillFieldRefInFn = (fn: Step) => {
      // For now, only "inc/createIncident" step has fillField elements
      if (fn.action === "inc/createIncident") {
        fn.modal.elements
          .filter((elem): elem is FillFieldElement => elem.type === "fillField")
          .forEach(validate);
      }
    };
  }
}
