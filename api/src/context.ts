import type { LoginUser } from "@/authn.ts";

/** User aware context */
export type UserContext = {
  user: LoginUser;
};
