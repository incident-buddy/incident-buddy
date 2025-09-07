import { DB } from "@/dbtype.ts";
import { Kysely } from "kysely";
import { factory } from "@/app-env.ts";
import { authentication } from "@/authn.ts";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { z } from "zod";
import "zod-openapi/extend";
import { toSchema } from "@/misc/schema-for-type.ts";
import { App } from "@/app.ts";
import {
  PresetTriggers,
  Trigger,
  TriggerCategory,
  TriggerCode,
  TriggerIcon,
} from "./model.ts";

const codeSchema = toSchema<TriggerCode>()(
  z.union([
    z.literal("incident.updated"),
    z.literal("slack.channel.joined"),
  ]),
);

const categorySchema = toSchema<TriggerCategory>()(
  z.union([
    z.literal("incident"),
    z.literal("slack"),
  ]),
);

const iconSchema = toSchema<TriggerIcon>()(
  z.union([
    z.literal("incident"),
    z.literal("slack"),
  ]),
);

const responseSchema = z.object({
  triggers: z.record(
    categorySchema,
    z.array(
      toSchema<Trigger>()(z.object({
        code: codeSchema,
        category: categorySchema,
        icon: iconSchema,
      })),
    ),
  ),
});

export const triggerApi = (app: App, db: Kysely<DB>) => {
  app.get("trigger", ...list(db));
};

const list = (_: Kysely<DB>) =>
  factory.createHandlers(
    authentication,
    describeRoute({
      description: "List available triggers for workflow",
      responses: {
        200: {
          description: "List of available triggers",
          content: {
            "application/json": { schema: resolver(responseSchema) },
          },
        },
      },
    }),
    (c) => {
      const triggers = PresetTriggers;
      return c.json({ triggers }, 200);
    },
  );
