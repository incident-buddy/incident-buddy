export type Trigger = {
  code: TriggerCode;
  category: TriggerCategory;
  icon: TriggerIcon;
};

const TriggerCodes = [
  "incident.updated",
  "slack.channel.joined",
] as const;
export type TriggerCode = (typeof TriggerCodes)[number];

export const TriggerCategories = [
  "incident",
  "slack",
] as const;
export type TriggerCategory = (typeof TriggerCategories)[number];

const TriggerIcons = [
  "incident",
  "slack",
] as const;
export type TriggerIcon = (typeof TriggerIcons)[number];

export const PresetTriggers: Record<TriggerCategory, Trigger[]> = {
  incident: [
    { code: "incident.updated", category: "incident", icon: "incident" },
  ],
  slack: [
    { code: "slack.channel.joined", category: "slack", icon: "slack" },
  ],
};
