// hono version server
import { zValidator } from "@hono/zod-validator";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { z } from "zod";
import incidents from "./features/incident/incident.handler.ts";

const app = new Hono();
app.use(logger());
app.get("/", (c) => c.text("Hello Node.js!"));

const route = app.post(
	"/posts",
	zValidator(
		"form",
		z.object({
			title: z.string(),
			body: z.string(),
		}),
	),
	(c) => {
		// ...
		return c.json(
			{
				ok: true,
				message: "Created!",
			},
			201,
		);
	},
);
app.route("/incidents", incidents);

const port = process.env.CORE_PORT;
if (!port) {
	throw new Error("CORE_PORT is not set");
}
serve({ ...route, port: Number(port) });
console.log(`[CORE] Server is running on port ${port}`);

export type RouteType = typeof route;
