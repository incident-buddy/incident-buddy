import type { Msg, SendResult } from "@worker/messages.ts";

export abstract class WorkerClient {
	abstract health(): Promise<{ ok: boolean }>;
	abstract send(msg: Msg): Promise<SendResult>;
}

export class LocalWorkerClient extends WorkerClient {
	readonly workerUrl: string;
	constructor() {
		super();
		const url = process.env.WORKER_URL;
		if (!url) {
			throw new Error("WORKER_URL environment variable is not set");
		}
		this.workerUrl = url;
	}

	async health(): Promise<{ ok: boolean }> {
		try {
			await fetch(this.workerUrl, { method: "GET" });
			return { ok: true };
		} catch (_e) {
			return { ok: false };
		}
	}

	async send(msg: Msg): Promise<SendResult> {
		try {
			await fetch(this.workerUrl, {
				method: "POST",
				body: JSON.stringify(msg),
			});

			return {
				ok: true,
			};
		} catch (e: unknown) {
			if (e instanceof Error) {
				return {
					ok: false,
					message: e.message,
				};
			} else {
				return {
					ok: false,
					message: `${e}`,
				};
			}
		}
	}
}
