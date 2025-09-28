import type { DB } from "@/db/type.ts";
import { eq } from "drizzle-orm";
import * as s from "drizzle/schema.ts";
import type { Incident, Assignment } from "shared/types/incident";

const selectClause = {
	id: s.incidents.id,
	code: s.incidents.code,
	title: s.incidents.title,
	summary: s.incidents.summary,
	latestStatus: {
		id: s.incidentStatuses.id,
		name: s.incidentStatuses.name,
		type: s.incidentStatuses.statusType,
		color: s.incidentStatuses.color,
	},
	declaredAt: s.incidents.declaredAt,
	tenantId: s.incidents.tenantId,
};

export class IncidentRepository {
	constructor(private db: DB) {}

	async store(incident: Incident) {
		await this.db
			.insert(s.incidents)
			.values({
				...incident,
				latestStatusId: incident.latestStatus.id,
			})
			.onConflictDoUpdate({
				target: s.incidents.id,
				set: {
					title: incident.title,
					summary: incident.summary,
					latestStatusId: incident.latestStatus.id,
				},
			});
	}

	async listIncidents(): Promise<Incident[]> {
		return await this.db
			.select(selectClause)
			.from(s.incidents)
			.innerJoin(
				s.incidentStatuses,
				eq(s.incidents.latestStatusId, s.incidentStatuses.id),
			);
	}

	async fetchIncident(args: { id: string }): Promise<Incident | null> {
		return await this.db
			.select(selectClause)
			.from(s.incidents)
			.innerJoin(
				s.incidentStatuses,
				eq(s.incidents.latestStatusId, s.incidentStatuses.id),
			)
			.where(eq(s.incidents.id, args.id))
			.then((rows) => rows.at(0) ?? null);
	}

	async listAssignments(args: { id: string }): Promise<Assignment[]> {
		const rows = await this.db
			.select({
				incidentId: s.incidentRoleSlots.incidentId,
				roleSlotId: s.incidentRoleSlots.id,
				role: {
					id: s.incidentRoles.id,
					name: s.incidentRoles.name,
					code: s.incidentRoles.code,
					abbr: s.incidentRoles.abbreviation,
					color: s.incidentRoles.color,
				},
				userId: s.users.id,
				familyName: s.users.familyName,
				givenName: s.users.givenName,
				email: s.userEmails.email,
			})
			.from(s.incidentRoleSlots)
			.innerJoin(
				s.incidentRoles,
				eq(s.incidentRoleSlots.roleId, s.incidentRoles.id),
			)
			.leftJoin(
				s.incidentRoleAssignments,
				eq(s.incidentRoleSlots.id, s.incidentRoleAssignments.roleSlotId),
			)
			.leftJoin(s.users, eq(s.incidentRoleAssignments.userId, s.users.id))
			.leftJoin(s.userEmails, eq(s.users.id, s.userEmails.userId))
			.where(eq(s.incidentRoleSlots.incidentId, args.id));

		return rows.map((row) => ({
			incidentId: row.incidentId,
			roleSlotId: row.roleSlotId,
			role: row.role,
			assignee: row.userId
				? {
						id: row.userId!,
						familyName: row.familyName!,
						givenName: row.givenName!,
						email: row.email!,
					}
				: undefined,
		}));
	}
}
