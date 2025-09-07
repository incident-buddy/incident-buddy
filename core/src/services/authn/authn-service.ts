import type { ServiceImpl } from "@connectrpc/connect";
import { create } from "@bufbuild/protobuf";
import { AuthorizationService } from "@pb/api/authn/v1/authn_pb.ts";
import { withDB } from "@/db/db.ts";
import { incidents, incidentStatuses } from "drizzle/schema.ts";
import { eq } from "drizzle-orm";
import { Code, ConnectError } from "@connectrpc/connect";

export const authorizationService: ServiceImpl<typeof AuthorizationService> = {
	async emailAuthorize(req, ctx) {
		return {
			result: {
				case: "unauthorized",
				value: {
					message: "oops",
				},
			},
		};
	},
};
