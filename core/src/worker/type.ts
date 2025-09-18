import { createContextKey } from "@connectrpc/connect";
import type { WorkerClient } from "./worker-client.ts";

export const workerClientContextKey = createContextKey<WorkerClient>(
	undefined as unknown as WorkerClient,
);
