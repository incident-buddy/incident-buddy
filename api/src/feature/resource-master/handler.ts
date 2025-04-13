import { ulid } from "@std/ulid/ulid";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { Kysely } from "kysely";
import { DB } from "@/dbtype.ts";
import { z } from "zod";
import "zod-openapi/extend";
import type { App } from "@/app.ts";
import { factory } from "@/app-env.ts";
import { authentication } from "@/authn.ts";
import { toSchema } from "@/misc/schema-for-type.ts";
import type {IconType, ResourceMaster, ValueType} from "./model.ts";
import { ResourceMasterQueryImpl } from "./query.ts";

const valueTypeSchema = toSchema<ValueType>()(
  z.union([
    z.literal("std:user"),
    z.literal("slack:channel:id"),
  ])
);

const iconTypeSchema = toSchema<IconType>()(
  z.union([
    z.literal("slack"),
    z.literal("team"),
    z.literal("box"),
    z.literal("function"),
  ])
);

const responseSchema = z.object({
  resourceMasters: z.array(
    toSchema<ResourceMaster>()(
      z.object({
        id: z.string().ulid().openapi({ example: ulid() }),
        name: z.string().openapi({ example: "Dev team" }),
        code: z.string().openapi({ example: "dev-team" }),
        description: z.string().openapi({ example: "Development team" }),
        icon: iconTypeSchema,
        category: z.string().openapi({ example: "team" }),
        attributes: z.array(z.object({
          code: z.string().openapi({ example: "team-slack-channel" }),
          name: z.string().openapi({ example: "Team Slack Channel" }),
          isArray: z.boolean(),
          orderNo: z.number(),
          valueType: valueTypeSchema,
        })),
      }),
    ),
  ),
});

export const resourceMasterApi = (app: App, db: Kysely<DB>) => {
  app.get("/resource-master", ...list(db));
};

const list = (db: Kysely<DB>) => {
  const query = new ResourceMasterQueryImpl(db);

  return factory.createHandlers(
    authentication,
    describeRoute({
      description: "List resource masters",
      responses: {
        200: {
          description: "List of resource masters",
          content: {
            "application/json": { schema: resolver(responseSchema) },
          },
        },
      },
    }),
    async (c) => {
      const ctx = { user: c.get("loginUser") };
      const resourceMasters = await query.list(ctx)
      return c.json({ resourceMasters }, 200);
    },
  );
};
