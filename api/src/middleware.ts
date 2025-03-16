import { createMiddleware } from "hono/factory";

// TODO AuthN
type LoginUser = {
  userId: string;
  tenantId: string;
}
export const authN = createMiddleware<{
  Variables: {
    loginUser?: LoginUser
  }
}>(async (c, next) => {
  c.set('loginUser', {userId: "test_user", tenantId: "0000000000000000TENANT_001"})
  await next()
});
