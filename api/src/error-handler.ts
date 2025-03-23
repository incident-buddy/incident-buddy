import type { ErrorHandler } from "hono/types";

import type { AppEnv } from "@/app-env.ts";

// TODO
export const handleError: ErrorHandler<AppEnv> = (e, c) => {
  console.error(e);
  return c.json(e, { status: 500 });
};

export type Cause = { cause: string };
/** util for creating cause object */
export const cause: (_: unknown) => Cause = (e) => {
  if (e instanceof Error) {
    return { cause: e.message };
  } else {
    return { cause: JSON.stringify(e) };
  }
};
