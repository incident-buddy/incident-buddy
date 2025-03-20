import type { UserContext } from "@/context.ts";
import { DB } from "@/dbtype.ts";
import { Kysely } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/postgres";

import { ResourceMaster, toValueType } from "./model.ts";

export interface ResourceMasterRepository {

  /** List all resource masters */
  list(c: UserContext): Promise<ResourceMaster[]>;
}

export class ResourceMasterRepositoryImpl implements ResourceMasterRepository {
  constructor(private db: Kysely<DB>) {}

  async list(c: UserContext): Promise<ResourceMaster[]> {
    const { tenantId } = c.user;
    const records = await this.db.selectFrom("resourceMasters")
      .select(["id", "name", "code", "description", "category"])
      .select((eb) => [
        jsonArrayFrom(
          eb.selectFrom("resourceMasterAttributes")
            .select(["name", "code", "valueType", "isArray", "orderNo"])
            .whereRef(
              "resourceMasterAttributes.resourceMasterId",
              "=",
              "resourceMasters.id",
            )
            .orderBy("resourceMasterAttributes.orderNo"),
        ).as("attributes"),
      ])
      .where("resourceMasters.tenantId", "=", tenantId)
      .execute();
    return records.map((r) => {
      const attributes = r.attributes.map((attr) => ({
        ...attr,
        valueType: toValueType(attr.valueType),
      }));
      return { ...r, attributes };
    });
  }
}
