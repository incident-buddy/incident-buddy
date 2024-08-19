import { App, AwsLambdaReceiver, LogLevel } from "@slack/bolt";
import type {
  AwsCallback,
  AwsEvent,
} from "@slack/bolt/dist/receivers/AwsLambdaReceiver.d.ts";
import { Config } from "config";
import { loadEnv, setupBot } from "./setup-bot.ts";

const { signingSecret, token, configPath } = loadEnv();

const receiver = new AwsLambdaReceiver({ signingSecret });
const app = new App({ token, receiver });
const config = await Config.load(configPath);
setupBot(app, config);

export const lambdaHandler = async (
  event: AwsEvent,
  context: unknown,
  callback: AwsCallback,
) => {
  const handler = await receiver.start();
  return handler(event, context, callback);
};
