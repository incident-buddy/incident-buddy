import { Hono } from "hono";
import { prettyJSON } from "hono/pretty-json";

import type { AppEnv } from "@/app-env.ts";
import { handleError } from "@/error-handler.ts";

export const newApp = () => {
  const app = new Hono<AppEnv>();
  app.use(prettyJSON());
  app.onError(handleError);
  return app;
};
export type App = ReturnType<typeof newApp>;

