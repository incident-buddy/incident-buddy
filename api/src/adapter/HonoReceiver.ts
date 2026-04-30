import { createHmac, timingSafeEqual } from "node:crypto";
import type { App, Receiver, ReceiverEvent } from "@slack/bolt";
import type { Context, Hono } from "hono";

/**
 * HonoReceiver - Hono ルーター上で Bolt for JS を動かす Receiver 実装
 *
 * Bolt の processEvent() はコールバックベースの ack() を使うが、
 * Hono は Promise ベースのレスポンスを期待する。
 * ここでは Promise ブリッジを使って両者を接続する:
 *   Hono handler → dispatchToBolt() → new Promise<Response>(resolve)
 *     → ReceiverEvent.ack() が resolve() を呼ぶ → Hono が Response を返す
 */
export class HonoReceiver implements Receiver {
  private app!: App;
  private signingSecret: string;

  constructor(signingSecret: string) {
    this.signingSecret = signingSecret;
  }

  init(app: App): void {
    this.app = app;
  }

  // Hono アプリにルートを登録する
  registerRoutes(hono: Hono): void {
    hono.post("/slack/events", async (c) => {
      return this.dispatchToBolt(c);
    });
    hono.post("/slack/interactions", async (c) => {
      return this.dispatchToBolt(c);
    });
  }

  // Bolt の processEvent は start() を呼ばなくても動く
  async start(): Promise<void> {}
  async stop(): Promise<void> {}

  private async dispatchToBolt(c: Context): Promise<Response> {
    const rawBody = await c.req.text();

    const verifyError = this.verifySignature(
      c.req.header("x-slack-signature") ?? "",
      c.req.header("x-slack-request-timestamp") ?? "",
      rawBody,
    );
    if (verifyError) {
      return c.json({ error: verifyError }, 401);
    }

    let parsedBody: Record<string, unknown>;
    const contentType = c.req.header("content-type") ?? "";

    if (contentType.includes("application/json")) {
      parsedBody = JSON.parse(rawBody) as Record<string, unknown>;
    } else {
      // application/x-www-form-urlencoded (slash commands, interactions)
      const params = new URLSearchParams(rawBody);
      const payload = params.get("payload");
      if (payload) {
        parsedBody = JSON.parse(payload) as Record<string, unknown>;
      } else {
        parsedBody = Object.fromEntries(params.entries());
      }
    }

    // Slack URL verification challenge — Bolt v4 は自動 ack しないので直接処理する
    if (parsedBody.type === "url_verification") {
      return c.json({ challenge: parsedBody.challenge });
    }

    const self = this;
    return new Promise<Response>(function (resolve, reject) {
      const event: ReceiverEvent = {
        body: parsedBody,
        ack: async (response) => {
          if (!response) {
            resolve(new Response("", { status: 200 }));
            return;
          }
          if (typeof response === "string") {
            resolve(
              new Response(response, {
                status: 200,
                headers: { "Content-Type": "text/plain" },
              }),
            );
            return;
          }
          resolve(
            new Response(JSON.stringify(response), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        },
        retryNum: Number(c.req.header("x-slack-retry-num") ?? 0),
        retryReason: c.req.header("x-slack-retry-reason") ?? "",
      };
      self.app.processEvent(event).catch(reject);
    });
  }

  private verifySignature(
    signature: string,
    timestamp: string,
    body: string,
  ): string | null {
    if (!signature || !timestamp) {
      return "Missing Slack signature headers";
    }
    const ts = Number(timestamp);
    if (Math.abs(Date.now() / 1000 - ts) > 300) {
      return "Request timestamp too old";
    }
    const hmac = createHmac("sha256", this.signingSecret);
    hmac.update(`v0:${timestamp}:${body}`);
    const computed = `v0=${hmac.digest("hex")}`;
    try {
      if (!timingSafeEqual(Buffer.from(computed), Buffer.from(signature))) {
        return "Invalid signature";
      }
    } catch {
      return "Invalid signature";
    }
    return null;
  }
}
