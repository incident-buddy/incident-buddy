import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Json = ColumnType<JsonValue, string, string>;

export type JsonArray = JsonValue[];

export type JsonObject = {
  [K in string]?: JsonValue;
};

export type JsonPrimitive = boolean | number | string | null;

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface IncidentEventHistories {
  eventBody: Json;
  eventType: string;
  externalId: string | null;
  externalPlace: string | null;
  externalPlatform: string | null;
  id: string;
  incidentId: string;
  placedAt: Timestamp;
  placedBy: string | null;
  tenantId: string;
}

export interface IncidentRoleAssignments {
  assignedAt: Timestamp;
  assignedBy: string | null;
  id: string;
  incidentId: string;
  roleId: string;
  tenantId: string;
  userId: string;
}

export interface IncidentRoles {
  code: string;
  id: string;
  name: string;
  tenantId: string;
}

export interface Incidents {
  code: string;
  createdAt: Timestamp;
  description: string | null;
  id: string;
  latestStatusId: string;
  tenantId: string;
  title: string;
}

export interface IncidentStatuses {
  color: string;
  id: string;
  name: string;
  statusType: string;
  tenantId: string;
}

export interface ResourceAttributeValues {
  attributeValue: Json;
  id: string;
  resourceId: string;
  resourceMasterAttributeId: string;
  tenantId: string;
}

export interface ResourceMasterAttributes {
  code: string;
  id: string;
  isArray: Generated<boolean>;
  name: string;
  orderNo: number;
  resourceMasterId: string;
  resourceReference: string | null;
  tenantId: string;
  valueType: string;
}

export interface ResourceMasters {
  category: string;
  code: string;
  description: string | null;
  id: string;
  name: string;
  tenantId: string;
}

export interface Resources {
  code: string;
  id: string;
  name: string;
  resourceMasterId: string;
  tenantId: string;
}

export interface SlackWorkspaces {
  code: string;
  id: string;
  tenantId: string;
  token: string;
}

export interface Tenants {
  id: string;
  name: string;
}

export interface UserEmails {
  email: string;
  id: string;
  tenantId: string;
  userId: string;
  verified: Generated<boolean>;
}

export interface Users {
  familyName: string;
  givenName: string;
  id: string;
  status: string;
  tenantId: string;
}

export interface WorkflowExecutions {
  finishedAt: Timestamp | null;
  id: string;
  startedAt: Timestamp;
  status: string;
  tenantId: string;
  workflowId: string;
  workflowVersionId: string;
}

export interface Workflows {
  id: string;
  name: string;
  tenantId: string;
  trigger: string;
}

export interface WorkflowVersions {
  id: string;
  isLatest: Generated<boolean>;
  steps: Generated<Json>;
  tenantId: string;
  version: string;
  workflowId: string;
}

export interface DB {
  incidentEventHistories: IncidentEventHistories;
  incidentRoleAssignments: IncidentRoleAssignments;
  incidentRoles: IncidentRoles;
  incidents: Incidents;
  incidentStatuses: IncidentStatuses;
  resourceAttributeValues: ResourceAttributeValues;
  resourceMasterAttributes: ResourceMasterAttributes;
  resourceMasters: ResourceMasters;
  resources: Resources;
  slackWorkspaces: SlackWorkspaces;
  tenants: Tenants;
  userEmails: UserEmails;
  users: Users;
  workflowExecutions: WorkflowExecutions;
  workflows: Workflows;
  workflowVersions: WorkflowVersions;
}
