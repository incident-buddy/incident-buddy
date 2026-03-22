import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../db/firestore.js";
import { incidentService } from "../../features/incident/incident.service.js";
import { app } from "../../index.js";
import { signSlackRequest } from "../helpers/slack-request.js";
import { server } from "../setup.js";

const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET ?? "";

async function clearIncidents() {
  const snap = await db.collection("incidents").get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

/** create_incident のビュー送信ペイロードを生成する */
function makeViewSubmissionBody(channelId: string | undefined) {
  const payload = {
    type: "view_submission",
    team: { id: "T000TEST", domain: "testteam" },
    user: { id: "U000TEST", name: "testuser" },
    api_app_id: "A000TEST",
    token: "test-token",
    trigger_id: "test-trigger",
    view: {
      id: "V000TEST",
      type: "modal",
      callback_id: "create_incident",
      private_metadata: JSON.stringify(
        channelId ? { channel_id: channelId } : {},
      ),
      state: {
        values: {
          title: {
            title_input: { type: "plain_text_input", value: "DB is down" },
          },
          severity: {
            severity_select: {
              type: "static_select",
              selected_option: {
                value: "P1",
                text: { type: "plain_text", text: "P1" },
              },
            },
          },
        },
      },
    },
  };
  const body = new URLSearchParams({
    payload: JSON.stringify(payload),
  }).toString();
  return {
    body,
    headers: signSlackRequest({ body, signingSecret: SIGNING_SECRET }),
  };
}

describe("エラー通知 - /inc コマンドでハンドラーが例外を投げた場合", () => {
  afterEach(() => {
    server.resetHandlers();
    vi.restoreAllMocks();
  });

  it("views.open が失敗したとき、チャンネルにエラーメッセージを投稿する", async () => {
    server.use(
      http.post("https://slack.com/api/views.open", () => {
        return HttpResponse.json({ ok: false, error: "internal_error" });
      }),
    );

    let capturedChannel: string | undefined;
    let capturedText: string | undefined;
    let resolve!: () => void;
    const called = new Promise<void>((r) => {
      resolve = r;
    });

    server.use(
      http.post(
        "https://slack.com/api/chat.postMessage",
        async ({ request }) => {
          const params = new URLSearchParams(await request.text());
          capturedChannel = params.get("channel") ?? undefined;
          capturedText = params.get("text") ?? undefined;
          resolve();
          return HttpResponse.json({
            ok: true,
            ts: "1234567890.000001",
            channel: "C000TEST",
          });
        },
      ),
    );

    const body = new URLSearchParams({
      command: "/inc",
      trigger_id: "test-trigger-id",
      channel_id: "C000TEST",
      user_id: "U000TEST",
      user_name: "testuser",
      team_id: "T000TEST",
      text: "",
    }).toString();
    const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });

    const res = await app.request("/slack/events", {
      method: "POST",
      headers,
      body,
    });

    expect(res.status).toBe(200);
    await called;
    expect(capturedChannel).toBe("C000TEST");
    expect(capturedText).toMatch(/^コマンドの実行に失敗しました\nエラー: /);
    expect(capturedText).toContain("internal_error");
  });

  it("エラー投稿自体が失敗してもアプリがクラッシュしない", async () => {
    server.use(
      http.post("https://slack.com/api/views.open", () => {
        return HttpResponse.json({ ok: false, error: "internal_error" });
      }),
      http.post("https://slack.com/api/chat.postMessage", () => {
        return HttpResponse.json({ ok: false, error: "channel_not_found" });
      }),
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const body = new URLSearchParams({
      command: "/inc",
      trigger_id: "test-trigger-id",
      channel_id: "C000TEST",
      user_id: "U000TEST",
      user_name: "testuser",
      team_id: "T000TEST",
      text: "",
    }).toString();
    const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });

    const res = await app.request("/slack/events", {
      method: "POST",
      headers,
      body,
    });
    expect(res.status).toBe(200);

    // Bolt の非同期ハンドラーが完了するまで待つ
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[incident-buddy] Failed to post error message:"),
      expect.anything(),
    );
  });
});

describe("エラー通知 - create_incident ビュー送信でハンドラーが例外を投げた場合", () => {
  beforeEach(clearIncidents);
  afterEach(async () => {
    server.resetHandlers();
    vi.restoreAllMocks();
    await clearIncidents();
  });

  it("incidentService.create が例外を投げたとき、チャンネルにエラーメッセージを投稿する", async () => {
    vi.spyOn(incidentService, "create").mockRejectedValue(
      new Error("DB connection failed"),
    );

    let capturedErrorChannel: string | undefined;
    let capturedErrorText: string | undefined;
    let resolveErrorPost!: () => void;
    const errorPostCalled = new Promise<void>((r) => {
      resolveErrorPost = r;
    });

    server.use(
      http.post(
        "https://slack.com/api/chat.postMessage",
        async ({ request }) => {
          const params = new URLSearchParams(await request.text());
          capturedErrorChannel = params.get("channel") ?? undefined;
          capturedErrorText = params.get("text") ?? undefined;
          resolveErrorPost();
          return HttpResponse.json({
            ok: true,
            ts: "1234567890.000001",
            channel: "C000TEST",
          });
        },
      ),
    );

    const { body, headers } = makeViewSubmissionBody("C000TEST");
    const res = await app.request("/slack/interactions", {
      method: "POST",
      headers,
      body,
    });

    expect(res.status).toBe(200);
    await errorPostCalled;
    expect(capturedErrorChannel).toBe("C000TEST");
    expect(capturedErrorText).toMatch(
      /^コマンドの実行に失敗しました\nエラー: /,
    );
    expect(capturedErrorText).toContain("DB connection failed");
  });

  it("エラー投稿自体が失敗してもアプリがクラッシュしない", async () => {
    vi.spyOn(incidentService, "create").mockRejectedValue(
      new Error("DB connection failed"),
    );

    server.use(
      http.post("https://slack.com/api/chat.postMessage", () => {
        return HttpResponse.json({ ok: false, error: "channel_not_found" });
      }),
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { body, headers } = makeViewSubmissionBody("C000TEST");
    const res = await app.request("/slack/interactions", {
      method: "POST",
      headers,
      body,
    });
    expect(res.status).toBe(200);

    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[incident-buddy] Failed to post error message:"),
      expect.anything(),
    );
  });

  it("channel_id が欠落しているとき、エラー投稿を行わず console.error でログのみ出力する", async () => {
    // サービス層で例外を発生させ、channelId が空のときガードが機能するか検証する
    vi.spyOn(incidentService, "create").mockRejectedValue(
      new Error("some error"),
    );

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    let postMessageCallCount = 0;

    server.use(
      http.post("https://slack.com/api/chat.postMessage", async () => {
        postMessageCallCount++;
        return HttpResponse.json({
          ok: true,
          ts: "1234567890.000001",
          channel: "",
        });
      }),
    );

    const { body, headers } = makeViewSubmissionBody(undefined);
    const res = await app.request("/slack/interactions", {
      method: "POST",
      headers,
      body,
    });

    expect(res.status).toBe(200);
    // Bolt の非同期ハンドラーが完了するまで待つ
    await new Promise((resolve) => setTimeout(resolve, 500));

    // channel_id が空なので postError のガードが発動し、postMessage は一切呼ばれない
    expect(postMessageCallCount).toBe(0);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "[incident-buddy] Cannot post error: channelId is empty.",
      ),
      expect.anything(),
    );
  });
});
