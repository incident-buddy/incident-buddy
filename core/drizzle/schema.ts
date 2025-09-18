import { pgTable, text, index, foreignKey, unique, boolean, uniqueIndex, integer, jsonb, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const tenants = pgTable("tenants", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
});

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	familyName: text("family_name").notNull(),
	givenName: text("given_name").notNull(),
	status: text().notNull(),
	tenantId: text("tenant_id").notNull(),
}, (table) => [
	index("users__ti_s").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "users_tenant_id_fkey"
		}),
]);

export const userEmails = pgTable("user_emails", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	email: text().notNull(),
	verified: boolean().default(false).notNull(),
	tenantId: text("tenant_id").notNull(),
}, (table) => [
	index("user_emails__ui").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_emails_user_id_fkey"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "user_emails_tenant_id_fkey"
		}),
	unique("user_emails__unique_email").on(table.email, table.tenantId),
]);

export const userHashedPasswords = pgTable("user_hashed_passwords", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	hashedPassword: text("hashed_password").notNull(),
	tenantId: text("tenant_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_hashed_passwords_user_id_fkey"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "user_hashed_passwords_tenant_id_fkey"
		}),
]);

export const resourceMasters = pgTable("resource_masters", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	code: text().notNull(),
	iconType: text("icon_type").notNull(),
	iconColor: text("icon_color").notNull(),
	tenantId: text("tenant_id").notNull(),
}, (table) => [
	uniqueIndex("resource_masters__ti_co").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.code.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "resource_masters_tenant_id_fkey"
		}),
]);

export const resourceMasterCategories = pgTable("resource_master_categories", {
	id: text().primaryKey().notNull(),
	resourceMasterId: text("resource_master_id").notNull(),
	categoryCode: text("category_code").notNull(),
	tenantId: text("tenant_id").notNull(),
}, (table) => [
	index("resource_master_categories__ti_cc_rm").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.categoryCode.asc().nullsLast().op("text_ops"), table.resourceMasterId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.resourceMasterId],
			foreignColumns: [resourceMasters.id],
			name: "resource_master_categories_resource_master_id_fkey"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "resource_master_categories_tenant_id_fkey"
		}),
]);

export const resourceMasterAttributes = pgTable("resource_master_attributes", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	code: text().notNull(),
	valueType: text("value_type").notNull(),
	resourceReference: text("resource_reference"),
	isArray: boolean("is_array").default(false).notNull(),
	orderNo: integer("order_no").notNull(),
	resourceMasterId: text("resource_master_id").notNull(),
	tenantId: text("tenant_id").notNull(),
}, (table) => [
	index("resource_master_attributes__rm_on").using("btree", table.resourceMasterId.asc().nullsLast().op("int4_ops"), table.orderNo.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.resourceReference],
			foreignColumns: [resourceMasters.id],
			name: "resource_master_attributes_resource_reference_fkey"
		}),
	foreignKey({
			columns: [table.resourceMasterId],
			foreignColumns: [resourceMasters.id],
			name: "resource_master_attributes_resource_master_id_fkey"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "resource_master_attributes_tenant_id_fkey"
		}),
]);

export const resources = pgTable("resources", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	code: text().notNull(),
	resourceMasterId: text("resource_master_id").notNull(),
	tenantId: text("tenant_id").notNull(),
}, (table) => [
	index("resources__ti_rm_co").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.resourceMasterId.asc().nullsLast().op("text_ops"), table.code.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.resourceMasterId],
			foreignColumns: [resourceMasters.id],
			name: "resources_resource_master_id_fkey"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "resources_tenant_id_fkey"
		}),
]);

export const resourceAttributeValues = pgTable("resource_attribute_values", {
	id: text().primaryKey().notNull(),
	resourceId: text("resource_id").notNull(),
	resourceMasterAttributeId: text("resource_master_attribute_id").notNull(),
	attributeValue: jsonb("attribute_value").notNull(),
	tenantId: text("tenant_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.resourceId],
			foreignColumns: [resources.id],
			name: "resource_attribute_values_resource_id_fkey"
		}),
	foreignKey({
			columns: [table.resourceMasterAttributeId],
			foreignColumns: [resourceMasterAttributes.id],
			name: "resource_attribute_values_resource_master_attribute_id_fkey"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "resource_attribute_values_tenant_id_fkey"
		}),
]);

export const incidentStatuses = pgTable("incident_statuses", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	statusType: text("status_type").notNull(),
	color: text().notNull(),
	tenantId: text("tenant_id").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "incident_statuses_tenant_id_fkey"
		}),
]);

export const incidentRoles = pgTable("incident_roles", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	code: text().notNull(),
	abbreviation: text().notNull(),
	color: text().notNull(),
	tenantId: text("tenant_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "incident_roles_tenant_id_fkey"
		}),
]);

export const incidents = pgTable("incidents", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	code: text().notNull(),
	summary: text().notNull(),
	declaredAt: timestamp("declared_at", { mode: 'date' }).notNull(),
	latestStatusId: text("latest_status_id").notNull(),
	tenantId: text("tenant_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.latestStatusId],
			foreignColumns: [incidentStatuses.id],
			name: "incidents_latest_status_id_fkey"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "incidents_tenant_id_fkey"
		}),
]);

export const incidentRoleSlots = pgTable("incident_role_slots", {
	id: text().primaryKey().notNull(),
	incidentId: text("incident_id").notNull(),
	roleId: text("role_id").notNull(),
	tenantId: text("tenant_id").notNull(),
}, (table) => [
	index("incident_role_slots__ti_ii_ri").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.incidentId.asc().nullsLast().op("text_ops"), table.roleId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.incidentId],
			foreignColumns: [incidents.id],
			name: "incident_role_slots_incident_id_fkey"
		}),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [incidentRoles.id],
			name: "incident_role_slots_role_id_fkey"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "incident_role_slots_tenant_id_fkey"
		}),
]);

export const incidentRoleAssignments = pgTable("incident_role_assignments", {
	id: text().primaryKey().notNull(),
	incidentId: text("incident_id").notNull(),
	roleSlotId: text("role_slot_id").notNull(),
	userId: text("user_id").notNull(),
	assignedAt: timestamp("assigned_at", { mode: 'date' }).notNull(),
	assignedBy: text("assigned_by"),
	tenantId: text("tenant_id").notNull(),
}, (table) => [
	index("incident_role_assignments__ti_ii_rsi").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.incidentId.asc().nullsLast().op("text_ops"), table.roleSlotId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.incidentId],
			foreignColumns: [incidents.id],
			name: "incident_role_assignments_incident_id_fkey"
		}),
	foreignKey({
			columns: [table.roleSlotId],
			foreignColumns: [incidentRoleSlots.id],
			name: "incident_role_assignments_role_slot_id_fkey"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "incident_role_assignments_user_id_fkey"
		}),
	foreignKey({
			columns: [table.assignedBy],
			foreignColumns: [users.id],
			name: "incident_role_assignments_assigned_by_fkey"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "incident_role_assignments_tenant_id_fkey"
		}),
]);

export const incidentEventHistories = pgTable("incident_event_histories", {
	id: text().primaryKey().notNull(),
	incidentId: text("incident_id").notNull(),
	eventType: text("event_type").notNull(),
	eventBody: jsonb("event_body").notNull(),
	placedAt: timestamp("placed_at", { mode: 'date' }).notNull(),
	placedBy: text("placed_by"),
	externalPlatform: text("external_platform"),
	externalPlace: text("external_place"),
	externalId: text("external_id"),
	tenantId: text("tenant_id").notNull(),
}, (table) => [
	index("incident_event_histories__ti_ii_et_ra").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.incidentId.asc().nullsLast().op("text_ops"), table.eventType.asc().nullsLast().op("timestamp_ops"), table.placedAt.asc().nullsLast().op("text_ops")),
	index("incident_event_histories_ti_ii_ep_ecp_eci").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.incidentId.asc().nullsLast().op("text_ops"), table.externalPlatform.asc().nullsLast().op("text_ops"), table.externalPlace.asc().nullsLast().op("text_ops"), table.externalId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.incidentId],
			foreignColumns: [incidents.id],
			name: "incident_event_histories_incident_id_fkey"
		}),
	foreignKey({
			columns: [table.placedBy],
			foreignColumns: [users.id],
			name: "incident_event_histories_placed_by_fkey"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "incident_event_histories_tenant_id_fkey"
		}),
]);

export const workflows = pgTable("workflows", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	trigger: text().notNull(),
	tenantId: text("tenant_id").notNull(),
}, (table) => [
	index("workflows__ti_tr").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.trigger.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "workflows_tenant_id_fkey"
		}),
]);

export const workflowVersions = pgTable("workflow_versions", {
	id: text().primaryKey().notNull(),
	workflowId: text("workflow_id").notNull(),
	version: text().notNull(),
	isLatest: boolean("is_latest").default(false).notNull(),
	steps: jsonb().default([]).notNull(),
	tenantId: text("tenant_id").notNull(),
}, (table) => [
	index("workflow_versions__ti_wi_il").using("btree", table.tenantId.asc().nullsLast().op("bool_ops"), table.workflowId.asc().nullsLast().op("text_ops"), table.isLatest.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflows.id],
			name: "workflow_versions_workflow_id_fkey"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "workflow_versions_tenant_id_fkey"
		}),
]);

export const workflowExecutions = pgTable("workflow_executions", {
	id: text().primaryKey().notNull(),
	workflowId: text("workflow_id").notNull(),
	workflowVersionId: text("workflow_version_id").notNull(),
	status: text().notNull(),
	startedAt: timestamp("started_at", { mode: 'date' }).notNull(),
	finishedAt: timestamp("finished_at", { mode: 'date' }),
	tenantId: text("tenant_id").notNull(),
}, (table) => [
	index("workflow_executions__ti_sa_s").using("btree", table.tenantId.asc().nullsLast().op("timestamp_ops"), table.startedAt.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.workflowId],
			foreignColumns: [workflows.id],
			name: "workflow_executions_workflow_id_fkey"
		}),
	foreignKey({
			columns: [table.workflowVersionId],
			foreignColumns: [workflowVersions.id],
			name: "workflow_executions_workflow_version_id_fkey"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "workflow_executions_tenant_id_fkey"
		}),
]);

export const slackWorkspaces = pgTable("slack_workspaces", {
	id: text().primaryKey().notNull(),
	code: text().notNull(),
	token: text().notNull(),
	tenantId: text("tenant_id").notNull(),
}, (table) => [
	index("slack_tokens__ti").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "slack_workspaces_tenant_id_fkey"
		}),
]);
