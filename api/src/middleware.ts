import { createMiddleware } from "hono/factory";

export const authN = createMiddleware(async (c, next) => {
  c.set("loginUser", {
    userId: "test_user",
    tenantId: "0000000000000000TENANT_001",
  });
  await next();
});
