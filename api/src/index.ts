import { serve } from "@hono/node-server";
import { App } from "@slack/bolt";
import { requireEnv } from "@src/env";
import { Hono } from "hono";
import "@src/lib/telemetry.js";
import { HonoReceiver } from "@src/adapter/hono-receiver";
import { registerHandlers } from "@src/adapter/slack-handler";

// Slack エンドポイントを HonoReceiver 経由で Bolt に委譲
const receiver = new HonoReceiver(requireEnv("SLACK_SIGNING_SECRET"));
registerHandlers(new App({ token: requireEnv("SLACK_BOT_TOKEN"), receiver }));

export const app = new Hono();
app.get("/health", (c) => c.json({ status: "ok" }));

receiver.registerRoutes(app);

// テスト実行時はサーバーを起動しない
if (!process.env.VITEST) {
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
}
