import { ulid } from "@std/ulid/ulid";
import { z } from "zod";
import "zod-openapi/extend";
import { App } from "@/app.ts";
import { Kysely } from "kysely";
import { DB } from "@/dbtype.ts";
import { factory } from "@/app-env.ts";
import { authentication } from "@/authn.ts";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { ListResourceResult, ResourceQueryImpl } from "./query.ts";
import { toSchema } from "../../misc/schema-for-type.ts";

const responseSchema = toSchema<ListResourceResult>()(
  z.object({
    resources: z.array(
      z.object({
        resourceId: z.string().openapi({ example: ulid() }),
        resourceName: z.string().openapi({ example: "E-commerce Team" }),
        resourceCode: z.string().openapi({ example: "ecom-team" }),
        masterId: z.string().ulid().openapi({ example: ulid() }),
        masterCode: z.string().openapi({ example: "team" }),
        masterName: z.string().openapi({ example: "Team" }),
      }),
    ),
  }),
);

export const resourceApi = (app: App, db: Kysely<DB>) => {
  app.get("/resource", ...list(db));
};

const list = (db: Kysely<DB>) => {
  const query = new ResourceQueryImpl(db);

  return factory.createHandlers(
    authentication,
    describeRoute({
      description: "List available resources",
      parameters: [
        {
          name: "masterId",
          in: "query",
          description:
            "Resource master ID to filter resources. If not provided, all resources will be listed",
          required: false,
          schema: z.string().ulid().optional().openapi({ example: ulid() }),
        },
      ],
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
      const masterId = c.req.query("masterId");
      return c.json(await query.list(ctx, masterId));
    },
  );
};
