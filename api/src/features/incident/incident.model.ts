export type IncidentStatus = "open" | "resolved";
export type Severity = string;
export type TimelineEventType =
  | "created"
  | "responder_added"
  | "service_added"
  | "resolved"
  | "note";

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
  createdBy: string;
  createdByName: string;
  teamIds: string[];
  serviceIds: string[];
  responderIds: string[];
  createdAt: Date;
  resolvedAt: Date | null;
  updatedAt: Date;
};

export type CreateIncidentParams = {
  title: string;
  description: string;
  severity: Severity;
  serviceName: string;
  slackChannelId: string;
  createdBy: string;
  createdByName: string;
};
