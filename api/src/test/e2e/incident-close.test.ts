import { Timestamp } from "firebase-admin/firestore";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db, incidentsCol } from "../../db/firestore.js";
import type { IncidentDoc } from "../../db/types.js";
import { app } from "../../index.js";
import { signSlackRequest } from "../helpers/slack-request.js";
import { server } from "../setup.js";

const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET ?? "";
const INCIDENT_CHANNEL_ID = "C_INC_CHANNEL";
const SLACK_CHANNEL_ID = "C_ORIGINAL_CHANNEL";
const SLACK_MESSAGE_TS = "1700000000.000001";
const WELCOME_MESSAGE_TS = "1700000000.000002";

async function clearIncidents() {
  const snap = await db.collection("incidents").get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

async function seedIncident(
  overrides: Partial<IncidentDoc> = {},
): Promise<IncidentDoc> {
  const ref = incidentsCol.doc();
  const now = Timestamp.now();
  const doc: IncidentDoc = {
    id: ref.id,
    title: "DB is down",
    description: "Primary DB not responding",
    status: "open",
    severity: "P1",
    serviceName: "payment-service",
    slackChannelId: SLACK_CHANNEL_ID,
    slackMessageTs: SLACK_MESSAGE_TS,
    incidentChannelId: INCIDENT_CHANNEL_ID,
    welcomeMessageTs: WELCOME_MESSAGE_TS,
    createdBy: "U000TEST",
    createdByName: "testuser",
    teamIds: [],
    serviceIds: [],
    responders: [],
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
    resolvedBy: null,
    resolvedByName: null,
    ...overrides,
  };
  await ref.set(doc);
  return doc;
}

function buildResolveActionPayload(params: {
  channelId: string;
  userId?: string;
  userName?: string;
}) {
  return {
    type: "block_actions",
    team: { id: "T000TEST", domain: "testteam" },
    user: {
      id: params.userId ?? "U000TEST",
      username: params.userName ?? "testuser",
      name: params.userName ?? "testuser",
    },
    api_app_id: "A000TEST",
    token: "test-token",
    trigger_id: "test-trigger-resolve",
    channel: { id: params.channelId },
    message: { ts: WELCOME_MESSAGE_TS, type: "message", text: "Incident..." },
    actions: [
      {
        type: "button",
        action_id: "resolve_incident",
        block_id: "resolve_buttons",
        action_ts: "1234567890.123456",
        value: "resolve",
      },
    ],
  };
}

function buildResolveModalSubmitPayload(params: {
  incidentId: string;
  incidentChannelId: string;
  userId?: string;
  userName?: string;
  note?: string;
}) {
  return {
    type: "view_submission",
    team: { id: "T000TEST", domain: "testteam" },
    user: {
      id: params.userId ?? "U000TEST",
      username: params.userName ?? "testuser",
      name: params.userName ?? "testuser",
    },
    api_app_id: "A000TEST",
    token: "test-token",
    trigger_id: "test-trigger-resolve",
    view: {
      id: "V_RESOLVE_MODAL",
      type: "modal",
      callback_id: "resolve_incident_modal",
      private_metadata: JSON.stringify({
        incidentId: params.incidentId,
        incidentChannelId: params.incidentChannelId,
      }),
      state: {
        values: {
          resolve_note_block: {
            resolve_note: {
              type: "plain_text_input",
              value: params.note ?? null,
            },
          },
        },
      },
    },
  };
}

describe("resolve_incident action（ボタン押下）", () => {
  beforeEach(clearIncidents);
  afterEach(() => {
    server.resetHandlers();
  });

  it("open のインシデントでボタンを押すと views.open が呼ばれる", async () => {
    await seedIncident();

    let viewsOpenCalled = false;
    server.use(
      http.post("https://slack.com/api/views.open", () => {
        viewsOpenCalled = true;
        return HttpResponse.json({ ok: true });
      }),
    );

    const payload = buildResolveActionPayload({ channelId: INCIDENT_CHANNEL_ID });
    const body = new URLSearchParams({ payload: JSON.stringify(payload) }).toString();
    const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });

    const res = await app.request("/slack/interactions", { method: "POST", headers, body });
    expect(res.status).toBe(200);
    await new Promise((r) => setTimeout(r, 100));

    expect(viewsOpenCalled).toBe(true);
  });

  it("すでに resolved のインシデントでボタンを押すと ephemeral が返り views.open は呼ばれない", async () => {
    await seedIncident({
      status: "resolved",
      resolvedAt: Timestamp.now(),
      resolvedBy: "U000TEST",
      resolvedByName: "testuser",
    });

    let viewsOpenCalled = false;
    let ephemeralCalled = false;
    server.use(
      http.post("https://slack.com/api/views.open", () => {
        viewsOpenCalled = true;
        return HttpResponse.json({ ok: true });
      }),
      http.post("https://slack.com/api/chat.postEphemeral", async ({ request }) => {
        const params = new URLSearchParams(await request.text());
        const text = params.get("text") ?? "";
        if (text.includes("解決済み")) {
          ephemeralCalled = true;
        }
        return HttpResponse.json({ ok: true });
      }),
    );

    const payload = buildResolveActionPayload({ channelId: INCIDENT_CHANNEL_ID });
    const body = new URLSearchParams({ payload: JSON.stringify(payload) }).toString();
    const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });

    const res = await app.request("/slack/interactions", { method: "POST", headers, body });
    expect(res.status).toBe(200);
    await new Promise((r) => setTimeout(r, 100));

    expect(viewsOpenCalled).toBe(false);
    expect(ephemeralCalled).toBe(true);
  });
});

describe("resolve_incident_modal view_submission（モーダル送信）", () => {
  beforeEach(clearIncidents);
  afterEach(() => {
    server.resetHandlers();
  });

  it("モーダル送信後、Firestore の status が resolved になり resolvedAt・resolvedBy が書き込まれる", async () => {
    const incident = await seedIncident();

    server.use(
      http.post("https://slack.com/api/chat.update", () =>
        HttpResponse.json({ ok: true, ts: WELCOME_MESSAGE_TS }),
      ),
      http.post("https://slack.com/api/chat.postMessage", () =>
        HttpResponse.json({ ok: true, ts: "1234567890.000003" }),
      ),
    );

    const payload = buildResolveModalSubmitPayload({
      incidentId: incident.id,
      incidentChannelId: INCIDENT_CHANNEL_ID,
      userId: "U_ALICE",
      userName: "alice",
      note: "再起動で解決した",
    });
    const body = new URLSearchParams({ payload: JSON.stringify(payload) }).toString();
    const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });

    const res = await app.request("/slack/interactions", { method: "POST", headers, body });
    expect(res.status).toBe(200);
    await new Promise((r) => setTimeout(r, 200));

    const snap = await incidentsCol.doc(incident.id).get();
    const data = snap.data();
    expect(data?.status).toBe("resolved");
    expect(data?.resolvedAt).not.toBeNull();
    expect(data?.resolvedBy).toBe("U_ALICE");
    expect(data?.resolvedByName).toBe("alice");
  });

  it("モーダル送信後、timeline に resolved イベントが記録される（説明文含む）", async () => {
    const incident = await seedIncident();

    server.use(
      http.post("https://slack.com/api/chat.update", () =>
        HttpResponse.json({ ok: true, ts: WELCOME_MESSAGE_TS }),
      ),
      http.post("https://slack.com/api/chat.postMessage", () =>
        HttpResponse.json({ ok: true, ts: "1234567890.000003" }),
      ),
    );

    const payload = buildResolveModalSubmitPayload({
      incidentId: incident.id,
      incidentChannelId: INCIDENT_CHANNEL_ID,
      userId: "U_ALICE",
      userName: "alice",
      note: "再起動で解決した",
    });
    const body = new URLSearchParams({ payload: JSON.stringify(payload) }).toString();
    const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });

    await app.request("/slack/interactions", { method: "POST", headers, body });
    await new Promise((r) => setTimeout(r, 200));

    const timelineSnap = await db
      .collection("incidents")
      .doc(incident.id)
      .collection("timeline")
      .get();

    expect(timelineSnap.docs).toHaveLength(1);
    const event = timelineSnap.docs[0]?.data();
    expect(event?.type).toBe("resolved");
    expect(event?.actorId).toBe("U_ALICE");
    expect(event?.actorName).toBe("alice");
    expect(event?.note).toBe("再起動で解決した");
  });

  it("モーダル送信後、#incidents のインシデントメッセージが更新される", async () => {
    const incident = await seedIncident();

    let incidentsMessageUpdated = false;
    let resolveWelcomeUpdate!: () => void;
    const welcomeUpdated = new Promise<void>((r) => {
      resolveWelcomeUpdate = r;
    });

    server.use(
      http.post("https://slack.com/api/chat.update", async ({ request }) => {
        const params = new URLSearchParams(await request.text());
        const ts = params.get("ts");
        if (ts === WELCOME_MESSAGE_TS) {
          resolveWelcomeUpdate();
        } else if (ts === SLACK_MESSAGE_TS) {
          incidentsMessageUpdated = true;
        }
        return HttpResponse.json({ ok: true, ts: ts ?? "" });
      }),
      http.post("https://slack.com/api/chat.postMessage", () =>
        HttpResponse.json({ ok: true, ts: "1234567890.000003" }),
      ),
    );

    const payload = buildResolveModalSubmitPayload({
      incidentId: incident.id,
      incidentChannelId: INCIDENT_CHANNEL_ID,
    });
    const body = new URLSearchParams({ payload: JSON.stringify(payload) }).toString();
    const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });

    await app.request("/slack/interactions", { method: "POST", headers, body });
    await welcomeUpdated;
    await new Promise((r) => setTimeout(r, 100));

    expect(incidentsMessageUpdated).toBe(true);
  });

  it("モーダル送信後、ウェルカムメッセージが解決済み表示に更新される", async () => {
    const incident = await seedIncident();

    let capturedWelcomeBody: string | null = null;
    let resolveWelcomeUpdate!: () => void;
    const welcomeUpdated = new Promise<void>((r) => {
      resolveWelcomeUpdate = r;
    });

    server.use(
      http.post("https://slack.com/api/chat.update", async ({ request }) => {
        const params = new URLSearchParams(await request.text());
        const ts = params.get("ts");
        if (ts === WELCOME_MESSAGE_TS) {
          capturedWelcomeBody = await request.text().catch(() => params.toString());
          resolveWelcomeUpdate();
        }
        return HttpResponse.json({ ok: true, ts: ts ?? "" });
      }),
      http.post("https://slack.com/api/chat.postMessage", () =>
        HttpResponse.json({ ok: true, ts: "1234567890.000003" }),
      ),
    );

    const payload = buildResolveModalSubmitPayload({
      incidentId: incident.id,
      incidentChannelId: INCIDENT_CHANNEL_ID,
      userId: "U_ALICE",
      userName: "alice",
    });
    const body = new URLSearchParams({ payload: JSON.stringify(payload) }).toString();
    const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });

    await app.request("/slack/interactions", { method: "POST", headers, body });
    await welcomeUpdated;

    expect(capturedWelcomeBody).not.toBeNull();
  });

  it("モーダル送信後、インシデントチャンネルに解決通知が投稿される（解決者名・経過時間を含む）", async () => {
    const incident = await seedIncident();

    let capturedNotificationText: string | null = null;
    let resolveNotification!: () => void;
    const notificationPosted = new Promise<void>((r) => {
      resolveNotification = r;
    });

    server.use(
      http.post("https://slack.com/api/chat.update", () =>
        HttpResponse.json({ ok: true, ts: WELCOME_MESSAGE_TS }),
      ),
      http.post("https://slack.com/api/chat.postMessage", async ({ request }) => {
        const params = new URLSearchParams(await request.text());
        const channel = params.get("channel");
        const text = params.get("text") ?? "";
        if (channel === INCIDENT_CHANNEL_ID && text.includes("クローズ")) {
          capturedNotificationText = text;
          resolveNotification();
        }
        return HttpResponse.json({ ok: true, ts: "1234567890.000003" });
      }),
    );

    const payload = buildResolveModalSubmitPayload({
      incidentId: incident.id,
      incidentChannelId: INCIDENT_CHANNEL_ID,
      userId: "U_ALICE",
      userName: "alice",
    });
    const body = new URLSearchParams({ payload: JSON.stringify(payload) }).toString();
    const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });

    await app.request("/slack/interactions", { method: "POST", headers, body });
    await notificationPosted;

    expect(capturedNotificationText).toContain("alice");
    expect(capturedNotificationText).toContain("クローズ");
  });

  it("すでに resolved のインシデントへのモーダル送信で Firestore は更新されない", async () => {
    const resolvedAt = Timestamp.now();
    const incident = await seedIncident({
      status: "resolved",
      resolvedAt,
      resolvedBy: "U_ORIGINAL",
      resolvedByName: "original-resolver",
    });

    server.use(
      http.post("https://slack.com/api/chat.postMessage", () =>
        HttpResponse.json({ ok: true, ts: "1234567890.000003" }),
      ),
    );

    const payload = buildResolveModalSubmitPayload({
      incidentId: incident.id,
      incidentChannelId: INCIDENT_CHANNEL_ID,
      userId: "U_ALICE",
      userName: "alice",
    });
    const body = new URLSearchParams({ payload: JSON.stringify(payload) }).toString();
    const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });

    await app.request("/slack/interactions", { method: "POST", headers, body });
    await new Promise((r) => setTimeout(r, 200));

    const snap = await incidentsCol.doc(incident.id).get();
    const data = snap.data();
    // resolvedBy は上書きされない
    expect(data?.resolvedBy).toBe("U_ORIGINAL");
    expect(data?.resolvedByName).toBe("original-resolver");
  });
});
