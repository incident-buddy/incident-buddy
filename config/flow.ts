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

const PostAction = z.object({
  action: z.literal("inc/post"),
  channelIds: z.array(z.string()),
  elements: z.array(PostElement),
});

const CyclicPostAction = z.object({
  action: z.literal("inc/cyclicPost"),
  channelIds: z.array(z.string()),
  interval: z.string(),
  elements: z.array(PostElement),
});

export const ActionListener = z.array(
  z.object({
    listen: z.string(),
    condition: z.string().optional(),
    exec: z.discriminatedUnion("action", [PostAction, CyclicPostAction]),
  }),
);
