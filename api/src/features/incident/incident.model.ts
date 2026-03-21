export type IncidentStatus = "open" | "resolved";
export type Severity = "P1" | "P2" | "P3" | "P4";
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
  slackChannelId: string;
  slackMessageTs: string;
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
  slackChannelId: string;
  createdBy: string;
  createdByName: string;
};
