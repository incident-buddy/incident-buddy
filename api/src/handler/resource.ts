import { ulid } from "@std/ulid/ulid";
import z from "zod";
import { toSchema } from "@/misc/schema-for-type.ts";
import {
    ResourceOverview
} from "@/slice/resource/model.ts";
import { App } from "@/app.ts";
import { Kysely } from "kysely";
import { DB } from "@/dbtype.ts";

import { factory } from "@/app-env.ts";
import { authentication } from "@/authn.ts";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import {ResourceQueryImpl} from "../slice/resource/query.ts";

const responseSchema = z.object({
    resources:
        z.array(
            z.object({
                id: z.string().openapi({ example: ulid() }),
                name: z.string().openapi({ example: "E-commerce Team" }),
                code: z.string().openapi({ example: "ecom-team" }),
                category: z.string().openapi({ example: "team" }),
            })

    )
});

export const resourceApi = (app: App, db: Kysely<DB>) => {
    app.get("resource", ...list(db));
};

const list = (db: Kysely<DB>) => {
    const query = new ResourceQueryImpl(db)

    return factory.createHandlers(
        authentication,
        describeRoute({
            description: "List available resources",
            responses: {
                200: {
                    description: "List of available resources",
                    content: {
                        "application/json": { schema: resolver(responseSchema) },
                    },
                },
            },
        }),
        async (c) => {
            const ctx = { user: c.get("loginUser") };
            return c.json(await query.list(ctx));
        },
    );
}

