import type { HandlerContext, ServiceImpl } from "@connectrpc/connect";
import {
	AssignmentService,
	type ListAssignmentsRequest,
} from "@pb/api/incident/v1/assignment_pb.ts";
import * as repository from "./assignment.repository.ts";

export const assignmentService: ServiceImpl<typeof AssignmentService> = {
	listAssignments: async function (
		req: ListAssignmentsRequest,
		ctx: HandlerContext,
	) {
		const assignments = await repository.list(ctx, {
			incidentId: req.incidentId,
		});
		return { assignments };
	},
};
