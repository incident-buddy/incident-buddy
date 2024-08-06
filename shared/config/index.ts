import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { z } from "zod";
import { CustomField, StdField } from "./field";
import { Flow } from "./flow";
import { Integration } from "./integrations";
import type { FillFieldElement } from "./model/ui-element.ts";
import {
	FallbackNotificationPolicy,
	NotificationGroups,
	NotificationPolicies,
} from "./notification";
import type { CreateIncidentStep, Step } from "./steps.ts";

const ConfigSchema = z.object({
	integration: Integration,
	stdField: StdField,
	customField: CustomField,
	flow: Flow,
	notificationGroups: NotificationGroups,
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

	get createIncidentFunction(): CreateIncidentStep {
		const trigger = this._config.flow.trigger;
		return this.findStep(trigger.invoke) as CreateIncidentStep;
	}

	findStep(name: string): Step | undefined {
		return this._config.flow.step.find((fn) => fn.name === name);
	}

	/** get next steps to be invoked after the step with the given callbackId */
	nextSteps(callbackId: string): Step[] {
		const invokerStep = this.findStep(callbackId); // callbackId is the name of the step
		if (!invokerStep) {
			throw new Error(`Step with name "${callbackId}" not found`);
		}

		// For now, only "inc/createIncident" step can invoke other steps
		if (invokerStep.action !== "inc/createIncident") {
			throw new Error(
				`Step with name "${callbackId}" is not a "inc/createIncident" action. Only "inc/createIncident" action can invoke other steps.`,
			);
		}

		return invokerStep.invoke
			.map((x) => this.findStep(x))
			.filter((x): x is Step => x !== undefined);
	}

	static async load(path: string): Promise<Config> {
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

		config.flow.step.forEach(fillFieldRefInFn);
	}
}
