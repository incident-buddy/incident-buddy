import { Hono } from "hono";
import { z } from "zod";
import { ulid } from "@std/ulid";
import "zod-openapi/extend";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { Kysely } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/postgres";
import { DB } from "../dbtype.ts";
import { authN } from "../middleware.ts";

const responseSchema = z.object({
  resourceMasters: z.array(
    z.object({
      id: z.string().ulid()
        .openapi({ description: "Resource master ID", example: ulid() }),
      name: z.string()
        .openapi({ description: "Resource master name", example: "Dev team" }),
      descriptoin: z.string()
        .openapi({
          description: "Resource master description",
          example: "Development team",
        }),
      code: z.string()
        .openapi({
          description: "Resource master code",
          example: "dev-team",
        }),
      category: z.string()
        .openapi({
          description: "Resource master category",
          example: "team",
        }),
    }),
  ),
});

export function registerHandler(app: Hono, db: Kysely<DB>) {
  app.get(
    "/resource-master",
    authN,
    describeRoute({
      description: "List resource masters",
      response: {
        200: {
          description: "List of resource masters",
          content: {
            "application/json": { schema: resolver(responseSchema) },
          },
        },
      },
    }),
    async (c) => {
      if (!c.var.loginUser) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      console.log(c.var.loginUser);
      const resourceMasters =
            await db.selectFrom("resourceMasters")
              .select(["id", "name", "code", "description", "category"])
              .select((eb) => [
                jsonArrayFrom(
                  eb.selectFrom("resourceMasterAttributes")
                    .select(["name", "code", "valueType", "isArray", "orderNo"])
                  .whereRef("resourceMasterAttributes.resourceMasterId", "=", "resourceMasters.id")
                  .orderBy("resourceMasterAttributes.orderNo")
                ).as("attributes")
              ])
              .where("resourceMasters.tenantId", "=", c.var.loginUser.tenantId)
              .execute();
      return c.json({resourceMasters});
    },
  );
}
