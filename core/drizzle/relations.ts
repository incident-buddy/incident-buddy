import { relations } from "drizzle-orm/relations";
import {
	tenants,
	users,
	userEmails,
	userHashedPasswords,
	resourceMasters,
	resourceMasterCategories,
	resourceMasterAttributes,
	resources,
	resourceAttributeValues,
	incidentStatuses,
	incidentRoles,
	incidents,
	incidentRoleSlots,
	incidentRoleAssignments,
	incidentEventHistories,
	workflows,
	workflowVersions,
	workflowExecutions,
	slackWorkspaces,
} from "./schema.ts";

export const usersRelations = relations(users, ({ one, many }) => ({
	tenant: one(tenants, {
		fields: [users.tenantId],
		references: [tenants.id],
	}),
	userEmails: many(userEmails),
	userHashedPasswords: many(userHashedPasswords),
	incidentRoleAssignments_userId: many(incidentRoleAssignments, {
		relationName: "incidentRoleAssignments_userId_users_id",
	}),
	incidentRoleAssignments_assignedBy: many(incidentRoleAssignments, {
		relationName: "incidentRoleAssignments_assignedBy_users_id",
	}),
	incidentEventHistories: many(incidentEventHistories),
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
	users: many(users),
	userEmails: many(userEmails),
	userHashedPasswords: many(userHashedPasswords),
	resourceMasters: many(resourceMasters),
	resourceMasterCategories: many(resourceMasterCategories),
	resourceMasterAttributes: many(resourceMasterAttributes),
	resources: many(resources),
	resourceAttributeValues: many(resourceAttributeValues),
	incidentStatuses: many(incidentStatuses),
	incidentRoles: many(incidentRoles),
	incidents: many(incidents),
	incidentRoleSlots: many(incidentRoleSlots),
	incidentRoleAssignments: many(incidentRoleAssignments),
	incidentEventHistories: many(incidentEventHistories),
	workflows: many(workflows),
	workflowVersions: many(workflowVersions),
	workflowExecutions: many(workflowExecutions),
	slackWorkspaces: many(slackWorkspaces),
}));

export const userEmailsRelations = relations(userEmails, ({ one }) => ({
	user: one(users, {
		fields: [userEmails.userId],
		references: [users.id],
	}),
	tenant: one(tenants, {
		fields: [userEmails.tenantId],
		references: [tenants.id],
	}),
}));

export const userHashedPasswordsRelations = relations(
	userHashedPasswords,
	({ one }) => ({
		user: one(users, {
			fields: [userHashedPasswords.userId],
			references: [users.id],
		}),
		tenant: one(tenants, {
			fields: [userHashedPasswords.tenantId],
			references: [tenants.id],
		}),
	}),
);

export const resourceMastersRelations = relations(
	resourceMasters,
	({ one, many }) => ({
		tenant: one(tenants, {
			fields: [resourceMasters.tenantId],
			references: [tenants.id],
		}),
		resourceMasterCategories: many(resourceMasterCategories),
		resourceMasterAttributes_resourceReference: many(resourceMasterAttributes, {
			relationName:
				"resourceMasterAttributes_resourceReference_resourceMasters_id",
		}),
		resourceMasterAttributes_resourceMasterId: many(resourceMasterAttributes, {
			relationName:
				"resourceMasterAttributes_resourceMasterId_resourceMasters_id",
		}),
		resources: many(resources),
	}),
);

export const resourceMasterCategoriesRelations = relations(
	resourceMasterCategories,
	({ one }) => ({
		resourceMaster: one(resourceMasters, {
			fields: [resourceMasterCategories.resourceMasterId],
			references: [resourceMasters.id],
		}),
		tenant: one(tenants, {
			fields: [resourceMasterCategories.tenantId],
			references: [tenants.id],
		}),
	}),
);

export const resourceMasterAttributesRelations = relations(
	resourceMasterAttributes,
	({ one, many }) => ({
		resourceMaster_resourceReference: one(resourceMasters, {
			fields: [resourceMasterAttributes.resourceReference],
			references: [resourceMasters.id],
			relationName:
				"resourceMasterAttributes_resourceReference_resourceMasters_id",
		}),
		resourceMaster_resourceMasterId: one(resourceMasters, {
			fields: [resourceMasterAttributes.resourceMasterId],
			references: [resourceMasters.id],
			relationName:
				"resourceMasterAttributes_resourceMasterId_resourceMasters_id",
		}),
		tenant: one(tenants, {
			fields: [resourceMasterAttributes.tenantId],
			references: [tenants.id],
		}),
		resourceAttributeValues: many(resourceAttributeValues),
	}),
);

export const resourcesRelations = relations(resources, ({ one, many }) => ({
	resourceMaster: one(resourceMasters, {
		fields: [resources.resourceMasterId],
		references: [resourceMasters.id],
	}),
	tenant: one(tenants, {
		fields: [resources.tenantId],
		references: [tenants.id],
	}),
	resourceAttributeValues: many(resourceAttributeValues),
}));

export const resourceAttributeValuesRelations = relations(
	resourceAttributeValues,
	({ one }) => ({
		resource: one(resources, {
			fields: [resourceAttributeValues.resourceId],
			references: [resources.id],
		}),
		resourceMasterAttribute: one(resourceMasterAttributes, {
			fields: [resourceAttributeValues.resourceMasterAttributeId],
			references: [resourceMasterAttributes.id],
		}),
		tenant: one(tenants, {
			fields: [resourceAttributeValues.tenantId],
			references: [tenants.id],
		}),
	}),
);

export const incidentStatusesRelations = relations(
	incidentStatuses,
	({ one, many }) => ({
		tenant: one(tenants, {
			fields: [incidentStatuses.tenantId],
			references: [tenants.id],
		}),
		incidents: many(incidents),
	}),
);

export const incidentRolesRelations = relations(
	incidentRoles,
	({ one, many }) => ({
		tenant: one(tenants, {
			fields: [incidentRoles.tenantId],
			references: [tenants.id],
		}),
		incidentRoleSlots: many(incidentRoleSlots),
	}),
);

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
	incidentStatus: one(incidentStatuses, {
		fields: [incidents.latestStatusId],
		references: [incidentStatuses.id],
	}),
	tenant: one(tenants, {
		fields: [incidents.tenantId],
		references: [tenants.id],
	}),
	incidentRoleSlots: many(incidentRoleSlots),
	incidentRoleAssignments: many(incidentRoleAssignments),
	incidentEventHistories: many(incidentEventHistories),
}));

export const incidentRoleSlotsRelations = relations(
	incidentRoleSlots,
	({ one, many }) => ({
		incident: one(incidents, {
			fields: [incidentRoleSlots.incidentId],
			references: [incidents.id],
		}),
		incidentRole: one(incidentRoles, {
			fields: [incidentRoleSlots.roleId],
			references: [incidentRoles.id],
		}),
		tenant: one(tenants, {
			fields: [incidentRoleSlots.tenantId],
			references: [tenants.id],
		}),
		incidentRoleAssignments: many(incidentRoleAssignments),
	}),
);

export const incidentRoleAssignmentsRelations = relations(
	incidentRoleAssignments,
	({ one }) => ({
		incident: one(incidents, {
			fields: [incidentRoleAssignments.incidentId],
			references: [incidents.id],
		}),
		incidentRoleSlot: one(incidentRoleSlots, {
			fields: [incidentRoleAssignments.roleSlotId],
			references: [incidentRoleSlots.id],
		}),
		user_userId: one(users, {
			fields: [incidentRoleAssignments.userId],
			references: [users.id],
			relationName: "incidentRoleAssignments_userId_users_id",
		}),
		user_assignedBy: one(users, {
			fields: [incidentRoleAssignments.assignedBy],
			references: [users.id],
			relationName: "incidentRoleAssignments_assignedBy_users_id",
		}),
		tenant: one(tenants, {
			fields: [incidentRoleAssignments.tenantId],
			references: [tenants.id],
		}),
	}),
);

export const incidentEventHistoriesRelations = relations(
	incidentEventHistories,
	({ one }) => ({
		incident: one(incidents, {
			fields: [incidentEventHistories.incidentId],
			references: [incidents.id],
		}),
		user: one(users, {
			fields: [incidentEventHistories.placedBy],
			references: [users.id],
		}),
		tenant: one(tenants, {
			fields: [incidentEventHistories.tenantId],
			references: [tenants.id],
		}),
	}),
);

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
	tenant: one(tenants, {
		fields: [workflows.tenantId],
		references: [tenants.id],
	}),
	workflowVersions: many(workflowVersions),
	workflowExecutions: many(workflowExecutions),
}));

export const workflowVersionsRelations = relations(
	workflowVersions,
	({ one, many }) => ({
		workflow: one(workflows, {
			fields: [workflowVersions.workflowId],
			references: [workflows.id],
		}),
		tenant: one(tenants, {
			fields: [workflowVersions.tenantId],
			references: [tenants.id],
		}),
		workflowExecutions: many(workflowExecutions),
	}),
);

export const workflowExecutionsRelations = relations(
	workflowExecutions,
	({ one }) => ({
		workflow: one(workflows, {
			fields: [workflowExecutions.workflowId],
			references: [workflows.id],
		}),
		workflowVersion: one(workflowVersions, {
			fields: [workflowExecutions.workflowVersionId],
			references: [workflowVersions.id],
		}),
		tenant: one(tenants, {
			fields: [workflowExecutions.tenantId],
			references: [tenants.id],
		}),
	}),
);

export const slackWorkspacesRelations = relations(
	slackWorkspaces,
	({ one }) => ({
		tenant: one(tenants, {
			fields: [slackWorkspaces.tenantId],
			references: [tenants.id],
		}),
	}),
);
