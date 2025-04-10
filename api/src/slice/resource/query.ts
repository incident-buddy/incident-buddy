import type { UserContext } from "@/context.ts";
import { DB } from "@/dbtype.ts";
import { Kysely } from "kysely";
import { associateBy } from "@std/collections";

export interface ResourceQuery {
    list(c: UserContext): Promise<ListResourceResult>;
}

export class ResourceQueryImpl implements ResourceQuery {
    constructor(private db: Kysely<DB>) {}

    async list(c: UserContext): Promise<ListResourceResult> {
        const { tenantId } = c.user;
        const records = await this.db
            .selectFrom("resourceMasters as rm")
            .innerJoin("resources as r", "rm.id", "r.resourceMasterId")
            .select([
                "rm.id as masterId",
                "rm.name as masterName",
                "rm.code as masterCode",
                "rm.category as masterCategory",
                "r.id as resourceId",
                "r.name as resourceName",
                "r.code as resourceCode",
            ])
            .where("rm.tenantId", "=", tenantId)
            .execute();

        const x = associateBy(records, (record) => record.masterId)
        console.log(x);

        return [];
    }
}

export type ListResourceResult = {
    category: {
        code: string;
        name: string;
    }
    masters: {
        id: string;
        name: string;
        code: string;
        attributes: {
            name: string;
            code: string;
            valueType: string;
            isArray: boolean;
            orderNo: number;
        }[];
        resources: {
            id: string;
            name: string;
            code: string;
        }[];
    }
}[];
