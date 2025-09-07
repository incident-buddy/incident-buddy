import { createContextKey } from "@connectrpc/connect";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "drizzle/schema.ts";

export type DB = NodePgDatabase<typeof schema>;
export const dbContextKey = createContextKey<DB>(undefined as unknown as DB);
