import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { requireEnv } from "./env.js";
import { boltApp, receiver } from "./slack/app.js";
import { registerActionHandlers } from "./slack/handlers/actions.js";
import { registerCommandHandlers } from "./slack/handlers/commands.js";
import { registerEventHandlers } from "./slack/handlers/events.js";

// Bolt ハンドラーを登録
registerCommandHandlers(boltApp);
registerEventHandlers(boltApp);
registerActionHandlers(boltApp);

const app = new Hono();

// Slack エンドポイントを HonoReceiver 経由で Bolt に委譲
receiver.registerRoutes(app);

app.get("/health", (c) => c.json({ status: "ok" }));

const port = Number(requireEnv("PORT"));

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
