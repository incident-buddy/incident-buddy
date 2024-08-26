import { Config } from "config";
import type { AsyncTask } from "model/async-task.ts";
import { DataStore } from "./datastore.ts";

const { token, configPath } = loadEnv();
const config = await Config.load(configPath);

const datastore = DataStore(config);

await datastore.ensureTable();

export async function handle(task: AsyncTask): Promise<void> {
  switch (task.type) {
    case "modal_submission":
      console.log(JSON.stringify(task.payload, null, 2));
  }
  console.log(config.toString());
}

function loadEnv(): {
  token: string;
  configPath: string;
} {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error("SLACK_BOT_TOKEN is not defined");
  }

  const configPath = process.env.CONFIG_PATH ?? "/opt/config.yaml";

  return { token, configPath };
}
