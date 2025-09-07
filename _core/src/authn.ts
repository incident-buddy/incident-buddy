import { createMiddleware } from "hono/factory";

export type LoginUser = {
  userId: string;
  tenantId: string;
};

type AuthenticationEnv = {
  Variables: {
    loginUser: LoginUser;
  };
};

export const authentication = createMiddleware<AuthenticationEnv>(
  async (c, next) => {
    // TODO
    const loginUser: LoginUser = {
      userId: "test_user",
      tenantId: "0000000000000000TENANT_001",
    };
    c.set("loginUser", loginUser);
    await next();
  },
);
