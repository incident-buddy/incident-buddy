import { withDB } from "@/db/db.ts";
import type { HandlerContext } from "@connectrpc/connect";
import { eq } from "drizzle-orm";
import {
	incidentRoleAssignments,
	incidentRoles,
	incidentRoleSlots,
	userEmails,
	users,
} from "drizzle/schema.ts";

export async function list(
	ctx: HandlerContext,
	{ incidentId }: { incidentId: string },
) {
	const rows = await withDB(ctx)
		.select({
			incidentId: incidentRoleSlots.incidentId,
			roleSlotId: incidentRoleSlots.id,
			roleId: incidentRoles.id,
			roleName: incidentRoles.name,
			roleCode: incidentRoles.code,
			roleAbbr: incidentRoles.abbreviation,
			roleColor: incidentRoles.color,
			userId: users.id,
			familyName: users.familyName,
			givenName: users.givenName,
			email: userEmails.email,
		})
		.from(incidentRoleSlots)
		.innerJoin(incidentRoles, eq(incidentRoleSlots.roleId, incidentRoles.id))
		.leftJoin(
			incidentRoleAssignments,
			eq(incidentRoleSlots.id, incidentRoleAssignments.roleSlotId),
		)
		.leftJoin(users, eq(incidentRoleAssignments.userId, users.id))
		.leftJoin(userEmails, eq(users.id, userEmails.userId))
		.where(eq(incidentRoleSlots.incidentId, incidentId));

	return rows.map((row) => ({
		...row,
		user: row.userId
			? {
					id: row.userId!,
					familyName: row.familyName!,
					givenName: row.givenName!,
					email: row.email ?? "",
				}
			: undefined,
	}));
}
