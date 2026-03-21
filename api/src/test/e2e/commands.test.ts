import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { app } from "../../index.js";
import { signSlackRequest } from "../helpers/slack-request.js";
import { server } from "../setup.js";

const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET!;

describe("POST /slack/events - /inc command", () => {
  afterEach(() => server.resetHandlers());

  it("responds 200 and calls views.open", async () => {
    // Bolt は ack() で HTTP レスポンスを即時返し、client.views.open() は非同期で後続実行される。
    // Promise を使って views.open が呼ばれるまで待機する。
    let resolveViewsOpen!: () => void;
    const viewsOpenCalled = new Promise<void>((resolve) => {
      resolveViewsOpen = resolve;
    });

    server.use(
      http.post("https://slack.com/api/views.open", () => {
        resolveViewsOpen();
        return HttpResponse.json({ ok: true, view: { id: "V000TEST" } });
      }),
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

    const headers = signSlackRequest(body, SIGNING_SECRET);

    const res = await app.request("/slack/events", {
      method: "POST",
      headers,
      body,
    });

    expect(res.status).toBe(200);
    await viewsOpenCalled; // Bolt の非同期処理が完了するまで待つ
  });
});
