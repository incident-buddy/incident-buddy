import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["./src/test/global-setup.ts"],
    setupFiles: ["./src/test/setup.ts"],
    hookTimeout: 30000,
    fileParallelism: false,
    env: {
      SLACK_SIGNING_SECRET: "test-signing-secret-32-characters!",
      SLACK_BOT_TOKEN:
        "xoxb-test-000000000000-000000000000-xxxxxxxxxxxxxxxxxxxxxxxx",
      FIRESTORE_PROJECT_ID: "demo-test",
      FIRESTORE_EMULATOR_HOST: "firestore:8080",
      PORT: "0",
    },
  },
});
