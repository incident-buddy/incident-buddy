import type { UserContext } from "@/context.ts";
import { DB } from "@/dbtype.ts";
import { Kysely } from "kysely";

export interface ResourceQuery {
  list(c: UserContext, masterId: string): Promise<ListResourceResult>;
}

export class ResourceQueryImpl implements ResourceQuery {
  constructor(private db: Kysely<DB>) {}

  async list(c: UserContext, masterId?: string): Promise<ListResourceResult> {
    const { tenantId } = c.user;
    let query = this.db
      .selectFrom("resources as r")
      .innerJoin("resourceMasters as rm", "rm.id", "r.resourceMasterId")
      .select([
        "r.id as resourceId",
        "r.code as resourceCode",
        "r.name as resourceName",
        "rm.id as masterId",
        "rm.code as masterCode",
        "rm.name as masterName",
      ]).where("r.tenantId", "=", tenantId)
      .orderBy(["rm.code", "r.code"]);
    if (masterId) {
      query = query.where("r.resourceMasterId", "=", masterId);
    }
    const resources = await query.execute();

    return { resources };
  }
}

export type ListResourceResult = {
  resources: {
    resourceId: string;
    resourceCode: string;
    resourceName: string;
    masterId: string;
    masterCode: string;
    masterName: string;
  }[];
};
