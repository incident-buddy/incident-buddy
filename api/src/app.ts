import { Hono } from "hono";
import { cors } from 'hono/cors'
import { prettyJSON } from "hono/pretty-json";

import type { AppEnv } from "@/app-env.ts";
import { handleError } from "@/error-handler.ts";

export const newApp = () => {
  const app = new Hono<AppEnv>();
  app.use(prettyJSON());
  app.use(cors({
    origin: ['http://localhost:5173'],
    allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }))
  app.onError(handleError);
  return app;
};
export type App = ReturnType<typeof newApp>;
