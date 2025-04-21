import type { Kysely } from "kysely";
import { createFactory } from "hono/factory";

import type { DB } from "@/dbtype.ts";
import type { Tracing } from "@/tracing.ts";

type DBContext = {
  db: Kysely<DB>;
};

/** AppEnv is the environment for the application. */
export type AppEnv = {
  Variables: {
    services: DBContext;
    tracing: Tracing;
  };
};
export const factory = createFactory<AppEnv>();
