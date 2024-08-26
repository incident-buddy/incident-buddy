import { Config } from "config";

const { token, configPath } = loadEnv();
const config = await Config.load(configPath);

export function handle(payload: unknown): void {
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
