import type { App } from "@slack/bolt";
import { Errors } from "@src/common/errors";

const StartCommand = "/inc";

const CommandMap = {
  config: () => {
    throw new Error("not implemented");
  },
};

const ViewMap = {
  create_incident: () => {
    throw new Error("not implemented");
  },
};

function isSubcommand(key: string): key is keyof typeof CommandMap {
  return key in CommandMap;
}

export function registerHandlers(app: App): void {
  app.command(StartCommand, async ({ ack, body }) => {
    await ack();

    const subcommand = body.text;
    if (isSubcommand(subcommand)) {
      CommandMap[subcommand]();
      return;
    }

    throw Errors.notFound("command", "");
  });

  app.event("app_mention", async () => {});

  for (const [viewId, handler] of Object.entries(ViewMap)) {
    app.view(viewId, async ({ ack }) => {
      await ack();
      handler();
    });
  }
}
