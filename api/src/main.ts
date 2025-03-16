import { ulid } from "@std/ulid";
import { Hono } from "hono";
import { z } from "zod";
import "zod-openapi/extend";
import { describeRoute, openAPISpecs } from "hono-openapi";
import { resolver, validator } from "hono-openapi/zod";
import { apiReference } from "@scalar/hono-api-reference";
import { PostgresDialect } from "kysely";
// @ts-types="npm:@types/pg-pool@^2.0.6"
import Pool from "pg-pool";
import* as ResourceMaster from "./resource_masters/handler.ts"

import { DB } from "./dbtype.ts";
import { CamelCasePlugin, Kysely } from "kysely";

const dialect = new PostgresDialect({
  pool: new Pool({
    database: Deno.env.get("DB_NAME"),
    user: Deno.env.get("DB_USER"),
    password: Deno.env.get("DB_PASS"),
    host: Deno.env.get("DB_HOST"),
    port: parseInt(Deno.env.get("DB_PORT") ?? "5432"),
    ssl: true,
    max: 10,
  }),
});

const db = new Kysely<DB>({ dialect, plugins: [new CamelCasePlugin()] });

// const slack = SlackAPI(Deno.env("SLACK_BOT_TOKEN")!)!;

const querySchema = z.object({
  name: z.string().optional(),
});
const responseSchema = z.object({
  incidents: z.object({
    id: z.string().ulid()
      .openapi({ description: "Incident id", example: ulid() }),
    code: z.string()
      .openapi({ description: "Incident code", example: "inc-123" }),
    title: z.string()
      .openapi({
        description: "Incident title",
        example: "Auth server outage",
      }),
    description: z.string()
      .openapi({
        description: "Incident description",
        example: "Auth server is down",
      }),
  }),
});

const route = describeRoute({
  description: "List incidents",
  response: {
    200: {
      description: "List of incidents",
      content: {
        "application/json": { schema: resolver(responseSchema) },
      },
    },
  },
});

const app = new Hono();
ResourceMaster.registerHandler(app, db);

app.get("/", route, validator("query", querySchema), async (c) => {
  const query = c.req.valid("query");
  const incidents = await db.selectFrom("incidents").selectAll().execute();
  console.log(incidents);

  return c.json({ incidents });
});

const spec = openAPISpecs(app, {
  documentation: {
    info: {
      title: "Incident Buddy API",
      version: "0.0.1",
      description: "",
    },
    servers: [
      { url: "http://localhost:8000", description: "local server" },
    ],
  },
});
app.get("/openapi", spec);
app.get(
  "/doc",
  apiReference({
    theme: "saturn",
    url: "/openapi",
  }),
);

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  Deno.serve(app.fetch);
}
