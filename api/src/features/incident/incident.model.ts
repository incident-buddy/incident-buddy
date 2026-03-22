export type IncidentStatus = "open" | "resolved";
export type Severity = string;
export type TimelineEventType =
  | "created"
  | "responder_added"
  | "service_added"
  | "resolved"
  | "note";

export type Responder = {
  roleId: string;
  userId: string;
  userName: string;
};

export type Incident = {
  readonly id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  severity: Severity;
  serviceName: string;
  slackChannelId: string;
  slackMessageTs: string;
  incidentChannelId?: string;
  welcomeMessageTs?: string;
  createdBy: string;
  createdByName: string;
  teamIds: string[];
  serviceIds: string[];
  responders: Responder[];
  createdAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  resolvedByName: string | null;
  updatedAt: Date;
};

export class AlreadyResolvedError extends Error {
  constructor() {
    super("このインシデントはすでに解決済みです");
    this.name = "AlreadyResolvedError";
  }
}

export type CreateIncidentParams = {
  title: string;
  description: string;
  severity: Severity;
  serviceName: string;
  slackChannelId: string;
  createdBy: string;
  createdByName: string;
};
