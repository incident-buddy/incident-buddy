import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../db/firestore.js";
import { incidentRepository } from "../../features/incident/incident.repository.js";
import { app } from "../../index.js";
import { signSlackRequest } from "../helpers/slack-request.js";
import { server } from "../setup.js";

const INCIDENT_CHANNEL_ID = "C_INC_PERSISTED";

const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET ?? "";

async function clearIncidents() {
  const snap = await db.collection("incidents").get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

describe("POST /slack/interactions - create_incident view submission", () => {
  beforeEach(clearIncidents);
  afterEach(() => {
    server.resetHandlers();
    vi.restoreAllMocks();
  });

  it("インシデント宣言後、作成したチャンネルの ID が Firestore に保存される", async () => {
    server.use(
      http.post("https://slack.com/api/conversations.create", () => {
        return HttpResponse.json({
          ok: true,
          channel: { id: INCIDENT_CHANNEL_ID, name: "inc-20260322-001" },
        });
      }),
    );

    let resolvePostMessage!: () => void;
    const postMessageCalled = new Promise<void>((resolve) => {
      resolvePostMessage = resolve;
    });
    server.use(
      http.post("https://slack.com/api/chat.postMessage", () => {
        resolvePostMessage();
        return HttpResponse.json({
          ok: true,
          ts: "1234567890.000001",
          channel: "C000TEST",
        });
      }),
    );

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
        private_metadata: JSON.stringify({ channel_id: "C000TEST" }),
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
    const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });

    const res = await app.request("/slack/interactions", {
      method: "POST",
      headers,
      body,
    });
    expect(res.status).toBe(200);
    await postMessageCalled;
    // updateIncidentChannelId は chat.postMessage の直後に非同期で実行されるため完了を待つ
    await new Promise((r) => setTimeout(r, 50));

    const incidents = await incidentRepository.findOpen();
    expect(incidents).toHaveLength(1);
    const incident = incidents[0];
    expect(incident?.incidentChannelId).toBe(INCIDENT_CHANNEL_ID);
  });

  it("creates an incident in Firestore and responds 200", async () => {
    // actions.ts は ack() で HTTP レスポンスを即時返し、Firestoreへの書き込みと
    // chat.postMessage は非同期で後続実行される。
    // chat.postMessage が呼ばれた時点で Firestore への書き込みも完了している。
    let resolvePostMessage!: () => void;
    const postMessageCalled = new Promise<void>((resolve) => {
      resolvePostMessage = resolve;
    });
    server.use(
      http.post("https://slack.com/api/chat.postMessage", () => {
        resolvePostMessage();
        return HttpResponse.json({
          ok: true,
          ts: "1234567890.000001",
          channel: "C000TEST",
        });
      }),
    );

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
        private_metadata: JSON.stringify({ channel_id: "C000TEST" }),
        state: {
          values: {
            title: {
              title_input: {
                type: "plain_text_input",
                value: "Database is down",
              },
            },
            severity: {
              severity_select: {
                type: "static_select",
                selected_option: {
                  value: "P1",
                  text: { type: "plain_text", text: "P1 - Critical" },
                },
              },
            },
            description: {
              description_input: {
                type: "plain_text_input",
                value: "Primary DB not responding",
              },
            },
          },
        },
      },
    };

    const body = new URLSearchParams({
      payload: JSON.stringify(payload),
    }).toString();

    const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });

    const res = await app.request("/slack/interactions", {
      method: "POST",
      headers,
      body,
    });

    expect(res.status).toBe(200);
    await postMessageCalled; // Bolt の非同期処理(Firestore書き込み)が完了するまで待つ

    const incidents = await incidentRepository.findOpen();
    expect(incidents).toHaveLength(1);
    const incident = incidents[0];
    expect(incident?.title).toBe("Database is down");
    expect(incident?.severity).toBe("P1");
    expect(incident?.createdBy).toBe("U000TEST");
  });

  it("インシデント宣言後、インシデントチャンネルにウェルカムメッセージが投稿される", async () => {
    server.use(
      http.post("https://slack.com/api/conversations.create", () => {
        return HttpResponse.json({
          ok: true,
          channel: { id: INCIDENT_CHANNEL_ID, name: "inc-20260322-001" },
        });
      }),
    );

    let resolveWelcome!: (params: URLSearchParams) => void;
    const welcomePosted = new Promise<URLSearchParams>((r) => {
      resolveWelcome = r;
    });

    server.use(
      http.post(
        "https://slack.com/api/chat.postMessage",
        async ({ request }) => {
          const params = new URLSearchParams(await request.text());
          if (params.get("channel") === INCIDENT_CHANNEL_ID) {
            resolveWelcome(params);
          }
          return HttpResponse.json({ ok: true, ts: "1234567890.000001" });
        },
      ),
    );

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
        private_metadata: JSON.stringify({ channel_id: "C000TEST" }),
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
            description: {
              description_input: {
                type: "plain_text_input",
                value: "Primary DB is not responding",
              },
            },
          },
        },
      },
    };

    const body = new URLSearchParams({
      payload: JSON.stringify(payload),
    }).toString();
    const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });

    const res = await app.request("/slack/interactions", {
      method: "POST",
      headers,
      body,
    });
    expect(res.status).toBe(200);

    const welcomeParams = await welcomePosted;

    // ウェルカムメッセージの内容検証（blocks の JSON 中にインシデント情報が含まれる）
    const fullBody = JSON.stringify(Object.fromEntries(welcomeParams));
    expect(fullBody).toContain("DB is down");
    expect(fullBody).toContain("P1");
    expect(fullBody).toContain("Primary DB is not responding");
    expect(fullBody).toContain("testuser");
  });

  it("ウェルカムメッセージ投稿失敗時、postError でエラーメッセージが投稿される", async () => {
    server.use(
      http.post("https://slack.com/api/conversations.create", () => {
        return HttpResponse.json({
          ok: true,
          channel: { id: INCIDENT_CHANNEL_ID, name: "inc-20260322-001" },
        });
      }),
    );

    let resolveError!: () => void;
    const errorCalled = new Promise<void>((r) => {
      resolveError = r;
    });
    let capturedErrorText: string | undefined;

    server.use(
      http.post(
        "https://slack.com/api/chat.postMessage",
        async ({ request }) => {
          const params = new URLSearchParams(await request.text());
          const channel = params.get("channel");
          const text = params.get("text") ?? "";

          if (channel === INCIDENT_CHANNEL_ID) {
            // ウェルカムメッセージ投稿を失敗させる
            return HttpResponse.json({ ok: false, error: "channel_not_found" });
          }
          if (text.includes("コマンドの実行に失敗しました")) {
            capturedErrorText = text;
            resolveError();
          }
          return HttpResponse.json({ ok: true, ts: "1234567890.000001" });
        },
      ),
    );

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
        private_metadata: JSON.stringify({ channel_id: "C000TEST" }),
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
    const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });

    const res = await app.request("/slack/interactions", {
      method: "POST",
      headers,
      body,
    });
    expect(res.status).toBe(200);
    await errorCalled;

    expect(capturedErrorText).toMatch(/コマンドの実行に失敗しました/);
    expect(capturedErrorText).toContain("channel_not_found");
  });

  it("updateIncidentChannelId 失敗時、postError でエラーメッセージが投稿される", async () => {
    vi.spyOn(
      incidentRepository,
      "updateIncidentChannelId",
    ).mockRejectedValueOnce(new Error("Firestore update failed"));

    let resolveError!: () => void;
    const errorCalled = new Promise<void>((r) => {
      resolveError = r;
    });
    let capturedErrorText: string | undefined;

    server.use(
      http.post(
        "https://slack.com/api/chat.postMessage",
        async ({ request }) => {
          const params = new URLSearchParams(await request.text());
          const text = params.get("text") ?? "";
          // updateIncidentChannelId は chat.postMessage の後に実行されるため、
          // エラーメッセージを含む 2 回目の postMessage を待つ
          if (text.includes("コマンドの実行に失敗しました")) {
            capturedErrorText = text;
            resolveError();
          }
          return HttpResponse.json({
            ok: true,
            ts: "1234567890.000001",
            channel: "C000TEST",
          });
        },
      ),
    );

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
        private_metadata: JSON.stringify({ channel_id: "C000TEST" }),
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
    const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });

    const res = await app.request("/slack/interactions", {
      method: "POST",
      headers,
      body,
    });
    expect(res.status).toBe(200);
    await errorCalled;

    expect(capturedErrorText).toMatch(/コマンドの実行に失敗しました/);
    expect(capturedErrorText).toContain("Firestore update failed");
  });
});
