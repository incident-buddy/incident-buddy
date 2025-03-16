import { SlackApp, SlackEdgeAppEnv } from "slack_edge";

const app = new SlackApp<SlackEdgeAppEnv>({
  env: {
    SLACK_SIGNING_SECRET: Deno.env.get("SLACK_SIGNING_SECRET")!,
    SLACK_BOT_TOKEN: Deno.env.get("SLACK_BOT_TOKEN"),
    SLACK_LOGGING_LEVEL: "DEBUG",
  },
});

app.command("/hello", async ({}) => {
  return "Hi!";
});

await Deno.serve({ port: 8001 }, async (request) => {
  return await app.run(request);
});
