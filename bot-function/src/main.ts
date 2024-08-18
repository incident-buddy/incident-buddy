import { App, AwsLambdaReceiver } from "@slack/bolt";
import type {
  AwsCallback,
  AwsEvent,
} from "@slack/bolt/dist/receivers/AwsLambdaReceiver.d.ts";
import { Config } from "config";
import { setupBot } from "./setup-bot.ts";

const { signingSecret, token, configPath } = loadEnv();

const receiver = new AwsLambdaReceiver({ signingSecret });
const app = new App({ token, receiver });
const config = await Config.load(configPath);
setupBot(app, config);

export const setupApp = app;
export const lambdaHandler = async (
  event: AwsEvent,
  context: unknown,
  callback: AwsCallback,
) => {
  const handler = await receiver.start();
  return handler(event, context, callback);
};

function loadEnv(): {
  signingSecret: string;
  token: string;
  configPath: string;
} {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    throw new Error("SLACK_SIGNING_SECRET is not defined");
  }

  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error("SLACK_BOT_TOKEN is not defined");
  }

  const configPath = process.env.CONFIG_PATH ?? "/opt/config.yaml";

  return { signingSecret, token, configPath };
}
