import type { ServiceImpl } from "@connectrpc/connect";
import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import {} from "@bufbuild/protobuf";
import {
	IncidentService,
	GetIncidentResponseSchema,
	IncidentStatusType,
	Color,
} from "@pb/api/incident/v1/incident_pb.ts";
import { withDB } from "@/db/db.ts";
import { create } from "@bufbuild/protobuf";
import * as repository from "./incident.repository.ts";
import { Incident } from "./incident.type.ts";

export const incidentService: ServiceImpl<typeof IncidentService> = {
	/** 指定したIDのインシデントを取得する */
	async getIncident(req, ctx) {
		const row = await repository.fetch(withDB(ctx), { id: req.id });
		if (!row) {
			return create(GetIncidentResponseSchema);
		}
		return {
			incident: {
				...row,
				declaredAt: timestampFromDate(row.declaredAt),
				latestStatus: {
					...row.latestStatus,
					type: statusFromString(row.latestStatus.type),
					color: colorFromString(row.latestStatus.color),
				},
			},
		};
	},

	/** インシデントを列挙する */
	async listIncidents(req, ctx) {
		const rows = await repository.list(withDB(ctx));
		const incidents = rows.map((row) => ({
			...row,
			declaredAt: timestampFromDate(row.declaredAt),
			latestStatus: {
				...row.latestStatus,
				type: statusFromString(row.latestStatus.type),
				color: colorFromString(row.latestStatus.color),
			},
		}));
		return { incidents };
	},

	/** タイトルを更新する */
	async updateIncidentTitle(req, ctx) {
		const { id, title } = req;
		withDB(ctx).transaction(async (tx) => {
			const incident = await repository.fetch(tx, { id });
			if (!incident) {
				return;
			}
			const mutation = Incident.updateTitle(incident, title);
			if (!mutation.diff) {
				return;
			}
			await repository.store(tx, mutation.outcome);
		});

		return {};
	},

	/** 概要を更新する */
	async updateIncidentSummary(req, ctx) {
		const { id, summary } = req;
		withDB(ctx).transaction(async (tx) => {
			const incident = await repository.fetch(tx, { id });
			if (!incident) {
				return;
			}
			const mutation = Incident.updateSummary(incident, summary);
			if (!mutation.diff) {
				return;
			}
			await repository.store(tx, mutation.outcome);
		});
		return {};
	},
};

function statusFromString(str: string): IncidentStatusType {
	switch (str) {
		case "INVESTIGATING":
			return IncidentStatusType.INVESTIGATING;
		case "DECLARED":
			return IncidentStatusType.DECLARED;
		case "ONGOING":
			return IncidentStatusType.ONGOING;
		case "CONVERGED":
			return IncidentStatusType.CONVERGED;
		case "CLOSED":
			return IncidentStatusType.CLOSED;
		default:
			return IncidentStatusType.UNSPECIFIED;
	}
}

// TODO sharedにprotoのserdeを集めたい
function colorFromString(str: string): Color {
	switch (str) {
		case "RED":
			return Color.RED;
		case "GREEN":
			return Color.GREEN;
		case "BLUE":
			return Color.BLUE;
		default:
			return Color.UNSPECIFIED;
	}
}
