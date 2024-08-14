import { readdir } from "node:fs";
import { App, AwsLambdaReceiver } from "@slack/bolt";
import type {
  AwsCallback,
  AwsEvent,
} from "@slack/bolt/dist/receivers/AwsLambdaReceiver.js";
import { Config } from "config";

const { signingSecret, token, configPath } = loadEnv();

const receiver = new AwsLambdaReceiver({ signingSecret });

const app = new App({ token, receiver });
console.log(configPath);
const config = await Config.load(configPath);

app.command("/hello", async ({ ack, body, client }) => {
  await ack();
  await client.chat.postMessage({
    channel: body.channel_id,
    text: JSON.stringify(config),
  });
});

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
