import type { HandlerContext } from "@connectrpc/connect";
import { dbContextKey } from "./type.ts";

export const withDB = (ctx: HandlerContext) => ctx.values.get(dbContextKey);
