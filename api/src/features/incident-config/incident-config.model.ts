export type SeverityDef = {
  label: string;
  description: string;
};

export type ServiceDef = {
  label: string;
  description: string;
};

export type SeverityCondition = {
  op: "==" | ">=" | "<=";
  label: string;
};

export type NotificationRule = {
  name: string;
  conditions: {
    severity?: SeverityCondition;
    service?: string;
  };
  actions: {
    channels: string[];
    mentions: string[];
  };
};

export type IncidentConfig = {
  severities: SeverityDef[];
  services: ServiceDef[];
  notificationRules: NotificationRule[];
};
