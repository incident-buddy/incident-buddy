import * as s from "drizzle/schema.ts";
import { eq } from "drizzle-orm";
import type { Incident } from "./incident.type.ts";
import type { DB } from "@/db/type.ts";

export async function store(db: DB, incident: Incident) {
	void (await db
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
		}));
}

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

export async function fetch(db: DB, args: { id: string }) {
	return await db
		.select(selectClause)
		.from(s.incidents)
		.innerJoin(
			s.incidentStatuses,
			eq(s.incidents.latestStatusId, s.incidentStatuses.id),
		)
		.where(eq(s.incidents.id, args.id))
		.then((rows) => rows.at(0) ?? null);
}

export async function list(db: DB) {
	return await db
		.select(selectClause)
		.from(s.incidents)
		.innerJoin(
			s.incidentStatuses,
			eq(s.incidents.latestStatusId, s.incidentStatuses.id),
		);
}
