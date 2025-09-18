import { createContextValues } from "@connectrpc/connect";
import { workerClientContextKey } from "./type.ts";
import { LocalWorkerClient, type WorkerClient } from "./worker-client.ts";

type Config = {
	mode: "local";
};

export function init(config: Config): WorkerClient {
	const { mode } = config;
	switch (mode) {
		case "local": {
			return new LocalWorkerClient();
		}
	}
}

export function setupDBContext(db: DB) {
	return createContextValues().set(dbContextKey, db);
}
