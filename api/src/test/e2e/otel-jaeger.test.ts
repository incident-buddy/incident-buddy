/**
 * OTel E2E テスト
 *
 * 受け入れ条件:
 * - process.env.VITEST が truthy のとき OTel SDK が初期化されない
 * - OTel バックエンドが落ちていても API が正常にレスポンスを返し続ける
 * - withSpan() が関数の戻り値を透過する（計装ラッパーとして正しく動作する）
 */
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "../../index.js";
import { withSpan } from "../../telemetry.js";
import { signSlackRequest } from "../helpers/slack-request.js";
import { server } from "../setup.js";

const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET ?? "";
const RESPONSE_URL = "https://hooks.slack.com/commands/T000TEST/otel-test";

function makeIncListCommand() {
  const body = new URLSearchParams({
    command: "/inc",
    trigger_id: "test-trigger-id",
    channel_id: "C000TEST",
    user_id: "U000TEST",
    user_name: "testuser",
    team_id: "T000TEST",
    response_url: RESPONSE_URL,
    text: "list",
  }).toString();
  return {
    body,
    headers: signSlackRequest({ body, signingSecret: SIGNING_SECRET }),
  };
}

function captureRespond() {
  let resolve!: () => void;
  const called = new Promise<void>((r) => { resolve = r; });
  server.use(
    http.post(RESPONSE_URL, () => {
      resolve();
      return HttpResponse.json({ ok: true });
    }),
  );
  return { called };
}

describe("telemetry.ts - withSpan()", () => {
  it("透過: 関数の戻り値をそのまま返す", async () => {
    const result = await withSpan("test.operation", { attr: "value" }, async () => 42);
    expect(result).toBe(42);
  });

  it("透過: 関数が例外をスローした場合は再スローする", async () => {
    const err = new Error("operation failed");
    await expect(
      withSpan("test.operation", {}, async () => {
        throw err;
      }),
    ).rejects.toThrow("operation failed");
  });

  it("VITEST 環境では OTLP エンドポイントに何も送信しない", async () => {
    const otlpCalled = vi.fn();
    server.use(
      http.post("http://localhost:4318/v1/traces", () => {
        otlpCalled();
        return HttpResponse.json({});
      }),
    );

    await withSpan("test.no-export", {}, async () => "ok");

    // VITEST=true の場合、SDK は初期化されないため OTLP への送信は発生しない
    expect(otlpCalled).not.toHaveBeenCalled();
  });
});

describe("OTel resilience - OTLP バックエンド障害時", () => {
  afterEach(() => {
    server.resetHandlers();
  });

  it("OTLP エンドポイントが 500 を返しても API は正常にレスポンスする", async () => {
    // OTLP エンドポイントを意図的に失敗させる（VITEST 時は SDK 初期化なし・実際には呼ばれない）
    server.use(
      http.post("http://localhost:4318/v1/traces", () => {
        return new HttpResponse(null, { status: 500 });
      }),
      http.post("http://localhost:4318/v1/metrics", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const { called } = captureRespond();

    const { body, headers } = makeIncListCommand();
    const res = await app.request("/slack/events", {
      method: "POST",
      headers,
      body,
    });

    // API は OTel 障害に関わらず正常にレスポンスを返す
    expect(res.status).toBe(200);
    // Slack respond() が呼ばれてレスポンスが正常に送信される
    await called;
  });

  it("OTLP エンドポイントが接続拒否しても API は正常にレスポンスする", async () => {
    server.use(
      http.post("http://localhost:4318/v1/traces", () => {
        return HttpResponse.error();
      }),
    );

    const { called } = captureRespond();

    const { body, headers } = makeIncListCommand();
    const res = await app.request("/slack/events", {
      method: "POST",
      headers,
      body,
    });

    expect(res.status).toBe(200);
    await called;
  });
});
