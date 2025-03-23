import { resourceMasterApi } from "@/routes/resource_master.ts";
import { triggerApi } from "@/routes/trigger.ts";
import { newApp } from "@/app.ts";
import { openapi } from "@/openapi.ts";
// @ts-types="npm:@types/pg-pool@^2.0.6"
import Pool from "pg-pool";
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import { DB } from "@/dbtype.ts";

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

const app = newApp();
resourceMasterApi(app, db);
triggerApi(app, db);
openapi(app)

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  Deno.serve(app.fetch);
}
