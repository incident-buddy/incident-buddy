import { App } from "@slack/bolt";
import { Config } from "config";
import { loadEnv, setupBot } from "./setup-bot.ts";

const { signingSecret, token, configPath } = loadEnv();

const app = new App({ token, signingSecret });
const config = await Config.load(configPath);
setupBot(app, config);

const port = process.env.PORT || 3000;
await app.start(port);
console.log(`Bot function is running at ${port}`);
