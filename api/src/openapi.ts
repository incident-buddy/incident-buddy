import { openAPISpecs } from "hono-openapi";
import { apiReference } from "@scalar/hono-api-reference";

import type { App } from "@/app.ts";

export const openapi = (app: App) => {
  const spec = openAPISpecs(app, {
    documentation: {
      info: {
        title: "Incident Buddy API",
        version: "0.0.1",
        description: "",
      },
      servers: [
        { url: "http://localhost:8000", description: "local server" },
      ],
    },
  });
  app.get("/openapi", spec);
  app.get("/doc", apiReference({ theme: "saturn", url: "/openapi" }));
};
