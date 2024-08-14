import { ModalElement, PostElement } from "model/ui-element";
import { z } from "zod";

export const CreateIncident = z.object({
  modal: z.object({
    title: z.string(),
    elements: z.array(ModalElement),
    submit: z.object({
      label: z.string(),
    }),
    cancel: z.object({
      label: z.string(),
    }),
  }),
  description: z.string(),
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
