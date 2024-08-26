import { serve } from "@hono/node-server";
import { Hono } from "hono";

import { Incident } from "model/incident.ts";

const app = new Hono();

app.post("/*", async (c) => {
  console.log(await c.req.json());
  return c.text("ok");
});

const port = 3001;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
