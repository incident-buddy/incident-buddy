import { z } from "zod";
import { ModalElement, PostElement } from "../model/ui-element";

const CreateIncidentStep = z.object({
  name: z.string(),
  action: z.literal("inc/createIncident"),
  modal: z.object({
    title: z.string(),
    elements: z.array(ModalElement),
    submit: z.object({
      label: z.string().optional(),
    }),
    cancel: z.object({ label: z.string() }).optional(),
  }),
  invoke: z.array(z.string()),
});
export type CreateIncidentStep = z.infer<typeof CreateIncidentStep>;

const SlackPostStep = z.object({
  name: z.string(),
  action: z.literal("slack/post"),
  channelId: z.string(),
  elements: z.array(PostElement),
});
export type SlackPostStep = z.infer<typeof SlackPostStep>;

const DatastoreCreateIncidentStep = z.object({
  name: z.string(),
  action: z.literal("datastore/createIncident"),
});

const Step = z.discriminatedUnion("action", [
  CreateIncidentStep,
  SlackPostStep,
  DatastoreCreateIncidentStep,
]);
export type Step = z.infer<typeof Step>;

export const Steps = z
  .array(Step)
  .refine(
    (fns) => {
      const names = new Set<string>();
      for (const fn of fns) {
        if (names.has(fn.name)) {
          return false;
        }
        names.add(fn.name);
      }
      return true;
    },
    { message: "Step's name must be unique. duplicated:" },
  )
  .refine(
    (fns) => {
      const afterCreateIncidentInvokeNotFound = fns.flatMap((fn) => {
        const invokes = fn.action === "inc/createIncident" ? fn.invoke : [];
        return invokes
          .filter((invoke) => !fns.some((x) => x.name === invoke))
          .map((invoke) => ({ name: fn.name, invoke }));
      });
      return afterCreateIncidentInvokeNotFound.length === 0;
    },
    {
      message: "Step specified in `invoke` of `inc/createIncident` not found",
    },
  );
