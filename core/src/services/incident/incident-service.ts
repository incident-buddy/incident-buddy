import type { ServiceImpl } from "@connectrpc/connect";
import {
	IncidentService,
	GetIncidentResponseSchema,
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
				description: incidents.description,
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
				description: incidents.description,
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
			);

		return { incidents: rows };
	},
};
