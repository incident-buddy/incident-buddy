import { ModalConfigElement, PostElement } from "model/ui-element.ts";
import { z } from "zod";
export const CreateIncidentModalConfig = z.object({
  title: z.string(),
  elements: z.array(ModalConfigElement),
  submit: z.object({
    label: z.string(),
  }),
  cancel: z.object({
    label: z.string(),
  }),
});
export type CreateIncidentModalConfig = z.infer<
  typeof CreateIncidentModalConfig
>;
export const CreateIncident = z.object({
  modal: CreateIncidentModalConfig,
});

const CyclicPostAction = z.object({
  action: z.literal("inc/cyclicPost"),
  interval: z.string(),
  elements: z.array(PostElement),
});

export const ActionListener = z.array(
  z.object({
    listen: z.string(),
    condition: z.string(),
    exec: z.discriminatedUnion("action", [CyclicPostAction]),
  }),
);
