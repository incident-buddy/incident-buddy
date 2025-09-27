// hono version server
import { zValidator } from "@hono/zod-validator";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { z } from "zod";

const app = new Hono();
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

serve({ ...route, port: 8000 });

export type AppType = typeof route;
