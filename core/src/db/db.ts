import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "drizzle/schema.ts";
import { Pool } from "pg";
import { dbContextKey, type DB } from "./type.ts";
import type { HandlerContext } from "@connectrpc/connect";

export async function init(): Promise<DB> {
	const dbUrl = process.env.DATABASE_URL;
	if (!dbUrl) {
		throw new Error("DATABASE_URL is not set");
	}
	const pool = await new Pool({
		connectionString: dbUrl,
	})
		.connect()
		.then((client) => {
			console.log("INIT", "Connected to database");
			return client;
		})
		.catch((error) => {
			console.error("INIT", `Failed to connect to database ${String(error)}}`);
			throw new Error(`Failed to connect to database ${String(error)}`);
		});

	return drizzle(pool, { schema });
}

export const withDB = (ctx: HandlerContext) => ctx.values.get(dbContextKey);
