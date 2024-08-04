import { z } from "zod";
import { Steps } from "./steps";

const Trigger = z.object({
	type: z.literal("slack/command"),
	invoke: z.string(),
});
export type Trigger = z.infer<typeof Trigger>;

export const Flow = z
	.object({
		trigger: Trigger,
		step: Steps,
	})
	.refine(
		(flow) => {
			// Check if the function specified in "flow.trigger.invoke" exists
			const fNames = flow.step.map((f) => f.name);
			return fNames.includes(flow.trigger.invoke);
		},
		{ message: 'Function specified in "flow.trigger.invoke" not found' },
	);
