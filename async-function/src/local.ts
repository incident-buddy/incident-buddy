import { serve } from "@hono/node-server";
import { Hono } from "hono";

import { handle } from "./handler.ts";

const app = new Hono();

app.post("/*", async (c) => {
  const payload = await c.req.json();
  console.log("payload: ", payload);
  await handle(payload);
  return c.text("ok");
});

const port = 3001;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
