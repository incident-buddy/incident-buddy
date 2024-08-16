import { z } from "zod";

const NotificationGroup = z.object({
  label: z.string(),
  ids: z.array(z.string()),
});
export const NotificationGroups = z.record(z.string(), NotificationGroup);
const NotificationPolicy = z.object({
  label: z.string(),
  recipients: z.array(NotificationGroup),
  condition: z.string(),
});

export const NotificationPolicies = z.array(NotificationPolicy);
export const FallbackNotificationPolicy = z.array(NotificationGroup);
