import { defineConfig } from "vitest/config";

// Firestore エミュレータ不要なユニットテスト（presenter, service, handler tryXxx）用設定
// globalSetup を含まないため、エミュレータなしで実行できる
export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    include: [
      "src/features/**/*.presenter.test.ts",
      "src/features/**/*.service.test.ts",
      "src/features/**/*.parser.test.ts",
      "src/slack/handlers/**/*.unit.test.ts",
    ],
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
