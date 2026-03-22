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
    mentions: string[];
  };
};

export type RoleDef = {
  id: string;
  label: string;
  description: string;
};

export type IncidentConfig = {
  severities: SeverityDef[];
  services: ServiceDef[];
  notificationRules: NotificationRule[];
  roles: RoleDef[];
};

export type ConfigLoadResult =
  | { type: "ok"; config: IncidentConfig }
  | { type: "error"; message: string };
