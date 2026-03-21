import type { Timestamp } from "firebase-admin/firestore";
import type {
  IncidentStatus,
  Severity,
  TimelineEventType,
} from "../features/incident/incident.model.js";

export type { IncidentStatus, Severity, TimelineEventType };

export type IncidentDoc = {
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
  createdAt: Timestamp;
  resolvedAt: Timestamp | null;
  updatedAt: Timestamp;
};

export type TeamDoc = {
  readonly id: string;
  name: string;
  slackChannelId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type MemberDoc = {
  readonly slackUserId: string;
  displayName: string;
  avatarUrl: string;
  teamIds: string[];
};

export type ServiceDoc = {
  readonly id: string;
  name: string;
  description: string;
  ownerTeamId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type TimelineEventDoc = {
  readonly id: string;
  type: TimelineEventType;
  actorId: string;
  actorName: string;
  note: string;
  occurredAt: Timestamp;
};

export type CreateIncidentInput = Omit<
  IncidentDoc,
  "id" | "createdAt" | "updatedAt" | "resolvedAt" | "status"
>;
