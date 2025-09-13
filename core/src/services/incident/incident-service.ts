import type { ServiceImpl } from "@connectrpc/connect";
import {
	IncidentService,
	GetIncidentResponseSchema,
	IncidentStatusType, Color
} from "@pb/api/incident/v1/incident_pb.ts";
import { withDB } from "@/db/db.ts";
import { incidents, incidentStatuses } from "drizzle/schema.ts";
import { eq } from "drizzle-orm";
import { create } from "@bufbuild/protobuf";

export const incidentService: ServiceImpl<typeof IncidentService> = {
	async getIncident(req, ctx) {
		const db = withDB(ctx);
		const [row] = await db
			.select({
				id: incidents.id,
				code: incidents.code,
				title: incidents.title,
				summary: incidents.summary,
			})
			.from(incidents)
			.innerJoin(
				incidentStatuses,
				eq(incidents.latestStatusId, incidentStatuses.id),
			)
			.where(eq(incidents.id, req.id));

		if (!row) {
			return create(GetIncidentResponseSchema);
		}

		return { incident: row };
	},
	async listIncidents(req, ctx) {
		const db = withDB(ctx);
		const rows = await db
			.select({
				id: incidents.id,
				code: incidents.code,
				title: incidents.title,
				summary: incidents.summary,
				latestStatus: {
					id: incidentStatuses.id,
					name: incidentStatuses.name,
					type: incidentStatuses.statusType,
					color: incidentStatuses.color,
				},
			})
			.from(incidents)
			.innerJoin(
				incidentStatuses,
				eq(incidents.latestStatusId, incidentStatuses.id),
			).then((rows) => rows.map((row) => ({
				...row,
				latestStatus: {
					...row.latestStatus,
					type: incidentStatusTypeFromString(row.latestStatus.type),
					color: colorFromString(row.latestStatus.color),
				}
			})));

		return { incidents: rows };
	},
	async updateIncidentTitle(req, ctx) {
		const { id, title } = req;
		const db = withDB(ctx);
		await db.update(incidents).set({ title }).where(eq(incidents.id, id)).returning();
		return {};
	},
	async updateIncidentSummary(req, ctx) {
		const { id, summary } = req;
		console.log("summary", summary);
		const db = withDB(ctx);
		await db.update(incidents).set({ summary }).where(eq(incidents.id, id)).returning();
		return {};
	}
};

function incidentStatusTypeFromString(
	str: string,
): IncidentStatusType {
	switch (str) {
		case "INVESTIGATING":
			return IncidentStatusType.INVESTIGATING;
		case "DECLARED":
			return IncidentStatusType.DECLARED
		case "ONGOING":
			return IncidentStatusType.ONGOING
		case "CONVERGED":
			return IncidentStatusType.CONVERGED
		case "CLOSED":
			return IncidentStatusType.CLOSED
		default:
			return IncidentStatusType.UNSPECIFIED
	}
}

function colorFromString(
	str: string,
): Color {
	switch (str) {
		case "RED":
			return Color.RED;
		case "GREEN":
			return Color.GREEN
		case "BLUE":
			return Color.BLUE
		default:
			return Color.UNSPECIFIED
	}
}
