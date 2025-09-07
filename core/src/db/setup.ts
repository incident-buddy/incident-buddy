import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "drizzle/schema.ts";
import { Pool } from "pg";
import { createContextValues } from "@connectrpc/connect";
import { dbContextKey, type DB } from "./type.ts";

type Config = {
	dbUrl: string;
};

export async function init(config: Config): Promise<DB> {
	const { dbUrl } = config;
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

export function setupDBContext(db: DB) {
	return createContextValues().set(dbContextKey, db);
}
