import { hc } from "hono/client";
import type { AppType } from "@core/server";

const host = process.env.CORE_HOST;
if (!host) {
	throw new Error("CORE_HOST is not set");
}
const port = process.env.CORE_PORT;
if (!port) {
	throw new Error("CORE_PORT is not set");
}

export const apiClient = hc<AppType>(`${host}:${port}`);
