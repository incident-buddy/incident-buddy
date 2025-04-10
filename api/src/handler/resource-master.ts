import { ulid } from "@std/ulid/ulid";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { z } from "zod";
import "zod-openapi/extend";

import type { App } from "@/app.ts";
import { factory } from "@/app-env.ts";
import { authentication } from "@/authn.ts";
import { toSchema } from "@/misc/schema-for-type.ts";
import { ResourceMaster } from "@/slice/resource-master/model.ts";
import { ResourceMasterRepositoryImpl } from "@/slice/resource-master/repository.ts";
import { Kysely } from "kysely";
import { DB } from "@/dbtype.ts";
import { ResourceMasterService } from "@/slice/resource-master/service.ts";

const responseSchema = z.object({
  resourceMasters: z.array(
    toSchema<ResourceMaster>()(
      z.object({
        id: z.string().ulid().openapi({ example: ulid() }),
        name: z.string().openapi({ example: "Dev team" }),
        description: z.string().openapi({ example: "Development team"}),
        code: z.string().openapi({ example: "dev-team" }),
        category: z.string().openapi({ example: "team" }),
        attributes: z.array(z.object({
          name: z.string().openapi({ example: "Team Slack Channel" }),
          code: z.string().openapi({ example: "team-slack-channel" }),
          valueType: z.union([z.literal("std:user"), z.literal("slack:channel")]),
          isArray: z.boolean(),
          orderNo: z.number(),
        })),
      }),
    ),
  ),
});

export const resourceMasterApi = (app: App, db: Kysely<DB>) => {
  app.get("/resource-master", ...list(db));
};

const list = (db: Kysely<DB>) => {
  const repo = new ResourceMasterRepositoryImpl(db);
  const service = new ResourceMasterService(repo);

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
    (c) => {
      const ctx = { user: c.get("loginUser") };
      return service.list(ctx).match(
        (res) => c.json({ resourceMasters: res }, 200),
        (err) => c.json(err, 500), // TODO
      );
    },
  );
};
