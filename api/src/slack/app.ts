import { App } from "@slack/bolt";
import { requireEnv } from "../env.js";
import { HonoReceiver } from "../receiver/HonoReceiver.js";

export const receiver = new HonoReceiver(requireEnv("SLACK_SIGNING_SECRET"));

export const boltApp = new App({
  token: requireEnv("SLACK_BOT_TOKEN"),
  receiver,
});
