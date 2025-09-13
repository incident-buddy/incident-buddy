import { data, Form, redirect } from "react-router";
import type { Route } from "./+types/login.route";
import { getSession, commitSession } from "~/sessions.server.ts";
import bcrypt from "bcrypt";
import { parseFormData } from "~/utils/formdata";
import { inputSchema } from "./type";
import { fetchHash } from "./login.repository.server.ts";
import { createLogger } from "~/logger.server.ts";

const logger = createLogger("login.route");

export const loader = async ({ request }: Route.LoaderArgs) => {
  const session = await getSession(request.headers.get("Cookie"));

  if (session.data.userId) {
    return redirect("/");
  }
};

const errors = {
  invalid: {
    code: "invalid-payload",
    message: "不正なリクエストです",
  },
  unauthorized: {
    code: "unauthorized",
    message: "認証に失敗しました",
  },
};

export const action = async ({ request }: Route.ActionArgs) => {
  const session = await getSession(request.headers.get("Cookie"));
  const parsed = parseFormData(await request.formData(), inputSchema);
  if (parsed.error) {
    return data({ error: errors.invalid }, { status: 400 });
  }

  const { email, password } = parsed.data;
  logger.audit("Login attempt for email", "loggin-attempt", { email });

  const record = await fetchHash(email);
  if (!record) {
    logger.audit("No user found for email", "loggin-failed.no-email", {
      email,
    });
    return { error: errors.unauthorized };
  }

  const isValid = await bcrypt.compare(password, record.hash);
  if (!isValid) {
    logger.audit("Password mismatch for email", "loggin-failed.password-mismatch", { email });
    return { error: errors.unauthorized };
  }

  logger.audit("User logged in successfully", "login-success", { email });
  session.set("userId", record.userId);
  const cookie = await commitSession(session);

  return redirect("/login", {
    headers: { "Set-Cookie": cookie },
  });
};

export default function ({ actionData, loaderData }: Route.ComponentProps) {
  const error = actionData?.error;
  return (
    <>
      <h1>Login</h1>
      {error && <p>{error.message}</p>}
      <Form method="POST">
        <input type="email" name="email" placeholder="Email" />
        <input type="password" name="password" placeholder="Password" />
        <button type="submit">login</button>
      </Form>
    </>
  );
}
