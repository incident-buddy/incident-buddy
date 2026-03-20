import type { App } from "@slack/bolt";

export function registerEventHandlers(app: App): void {
  // app_mention などの Events API ハンドラーをここに追加する
  app.event("app_mention", async ({ say }) => {
    await say("Hi! Use `/inc` to declare an incident.");
  });
}
