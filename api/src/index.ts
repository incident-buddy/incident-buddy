import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

app.post("/", async (c) => {
	console.log(await c.req.json());
	return c.json({ ok: true });
});

serve(
	{
		fetch: app.fetch,
		port: 8888,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
