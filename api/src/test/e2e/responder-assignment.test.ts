import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
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

function withConfigFile({
  content,
  fn,
}: {
  content: string;
  fn: (filePath: string) => Promise<void>;
}) {
  return async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "incident-config-"));
    const filePath = path.join(dir, "incident-config.md");
    fs.writeFileSync(filePath, content, "utf8");
    process.env.INCIDENT_CONFIG_PATH = filePath;
    try {
      await fn(filePath);
    } finally {
      delete process.env.INCIDENT_CONFIG_PATH;
      fs.rmSync(dir, { recursive: true });
    }
  };
}

const CONFIG_WITH_ROLES = `# Incident Config

## Severities

### P1
最高重大度

### P2
高重大度

## Roles

### commander
コマンダー。インシデント全体を指揮する。

### investigator
調査担当。原因究明を担当する。
`;

function buildAssignRolePayload(params: {
  actionId: string;
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
    trigger_id: "test-trigger",
    channel: { id: params.channelId },
    message: { ts: WELCOME_MESSAGE_TS, type: "message", text: "Incident..." },
    actions: [
      {
        type: "button",
        action_id: params.actionId,
        block_id: "role_buttons",
        action_ts: "1234567890.123456",
        value: params.actionId.replace("assign_role_", ""),
      },
    ],
  };
}

describe("assign_role_{roleId} action", () => {
  beforeEach(clearIncidents);
  afterEach(() => {
    server.resetHandlers();
  });

  it(
    "ボタン押下で responders が Firestore に追加される",
    withConfigFile({
      content: CONFIG_WITH_ROLES,
      fn: async () => {
        const incident = await seedIncident();

        let resolveUpdate!: () => void;
        const updateCalled = new Promise<void>((r) => {
          resolveUpdate = r;
        });

        server.use(
          http.post("https://slack.com/api/chat.update", () => {
            resolveUpdate();
            return HttpResponse.json({ ok: true, ts: WELCOME_MESSAGE_TS });
          }),
        );

        const payload = buildAssignRolePayload({
          actionId: "assign_role_commander",
          channelId: INCIDENT_CHANNEL_ID,
        });
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

        await updateCalled;
        await new Promise((r) => setTimeout(r, 50));

        const snap = await incidentsCol.doc(incident.id).get();
        const data = snap.data();
        expect(data?.responders).toHaveLength(1);
        expect(data?.responders[0]).toMatchObject({
          roleId: "commander",
          userId: "U000TEST",
          userName: "testuser",
        });
      },
    }),
  );

  it(
    "ボタン押下でウェルカムメッセージが chat.update で更新される",
    withConfigFile({
      content: CONFIG_WITH_ROLES,
      fn: async () => {
        await seedIncident();

        let capturedTs: string | null = null;
        let capturedBody: string | null = null;
        let resolveUpdate!: () => void;
        const updateCalled = new Promise<void>((r) => {
          resolveUpdate = r;
        });

        server.use(
          http.post(
            "https://slack.com/api/chat.update",
            async ({ request }) => {
              const text = await request.text();
              const params = new URLSearchParams(text);
              if (params.get("ts") === WELCOME_MESSAGE_TS) {
                capturedTs = params.get("ts");
                capturedBody = text;
                resolveUpdate();
              }
              return HttpResponse.json({ ok: true, ts: WELCOME_MESSAGE_TS });
            },
          ),
        );

        const payload = buildAssignRolePayload({
          actionId: "assign_role_commander",
          channelId: INCIDENT_CHANNEL_ID,
          userId: "U_ALICE",
          userName: "alice",
        });
        const body = new URLSearchParams({
          payload: JSON.stringify(payload),
        }).toString();
        const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });

        await app.request("/slack/interactions", { method: "POST", headers, body });
        await updateCalled;

        expect(capturedTs).toBe(WELCOME_MESSAGE_TS);
        // 更新後のウェルカムメッセージに担当者名が含まれる
        expect(capturedBody).toContain("alice");
      },
    }),
  );

  it(
    "ボタン押下で #incidents のインシデントメッセージが更新される",
    withConfigFile({
      content: CONFIG_WITH_ROLES,
      fn: async () => {
        await seedIncident();

        let incidentsChannelUpdated = false;
        let resolveWelcomeUpdate!: () => void;
        const welcomeUpdated = new Promise<void>((r) => {
          resolveWelcomeUpdate = r;
        });

        server.use(
          http.post(
            "https://slack.com/api/chat.update",
            async ({ request }) => {
              const params = new URLSearchParams(await request.text());
              const ts = params.get("ts");
              if (ts === WELCOME_MESSAGE_TS) {
                resolveWelcomeUpdate();
              } else if (ts === SLACK_MESSAGE_TS) {
                incidentsChannelUpdated = true;
              }
              return HttpResponse.json({ ok: true, ts: ts ?? "" });
            },
          ),
        );

        const payload = buildAssignRolePayload({
          actionId: "assign_role_commander",
          channelId: INCIDENT_CHANNEL_ID,
        });
        const body = new URLSearchParams({
          payload: JSON.stringify(payload),
        }).toString();
        const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });

        await app.request("/slack/interactions", { method: "POST", headers, body });
        await welcomeUpdated;
        await new Promise((r) => setTimeout(r, 100));

        expect(incidentsChannelUpdated).toBe(true);
      },
    }),
  );

  it(
    "ボタン押下でチャンネルにアサイン通知が投稿される",
    withConfigFile({
      content: CONFIG_WITH_ROLES,
      fn: async () => {
        await seedIncident();

        let capturedNotificationText: string | null = null;
        let resolveNotification!: () => void;
        const notificationPosted = new Promise<void>((r) => {
          resolveNotification = r;
        });

        server.use(
          http.post("https://slack.com/api/chat.update", () => {
            return HttpResponse.json({ ok: true, ts: WELCOME_MESSAGE_TS });
          }),
          http.post(
            "https://slack.com/api/chat.postMessage",
            async ({ request }) => {
              const params = new URLSearchParams(await request.text());
              const channel = params.get("channel");
              const text = params.get("text") ?? "";
              // アサイン通知はインシデントチャンネルへ投稿される
              if (channel === INCIDENT_CHANNEL_ID && text.includes("コマンダー")) {
                capturedNotificationText = text;
                resolveNotification();
              }
              return HttpResponse.json({ ok: true, ts: "1234567890.000001" });
            },
          ),
        );

        const payload = buildAssignRolePayload({
          actionId: "assign_role_commander",
          channelId: INCIDENT_CHANNEL_ID,
          userId: "U_ALICE",
          userName: "alice",
        });
        const body = new URLSearchParams({
          payload: JSON.stringify(payload),
        }).toString();
        const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });

        await app.request("/slack/interactions", { method: "POST", headers, body });
        await notificationPosted;

        expect(capturedNotificationText).toContain("alice");
        expect(capturedNotificationText).toContain("コマンダー");
      },
    }),
  );

  it(
    "ボタン押下で timeline に responder_added が記録される",
    withConfigFile({
      content: CONFIG_WITH_ROLES,
      fn: async () => {
        const incident = await seedIncident();

        let resolveUpdate!: () => void;
        const updateCalled = new Promise<void>((r) => {
          resolveUpdate = r;
        });

        server.use(
          http.post("https://slack.com/api/chat.update", () => {
            resolveUpdate();
            return HttpResponse.json({ ok: true, ts: WELCOME_MESSAGE_TS });
          }),
        );

        const payload = buildAssignRolePayload({
          actionId: "assign_role_commander",
          channelId: INCIDENT_CHANNEL_ID,
        });
        const body = new URLSearchParams({
          payload: JSON.stringify(payload),
        }).toString();
        const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });

        await app.request("/slack/interactions", { method: "POST", headers, body });
        await updateCalled;
        await new Promise((r) => setTimeout(r, 50));

        const timelineSnap = await db
          .collection("incidents")
          .doc(incident.id)
          .collection("timeline")
          .get();

        expect(timelineSnap.docs).toHaveLength(1);
        const event = timelineSnap.docs[0]?.data();
        expect(event?.type).toBe("responder_added");
        expect(event?.actorId).toBe("U000TEST");
        expect(event?.actorName).toBe("testuser");
      },
    }),
  );

  it(
    "同一ロールに重複アサイン時、ephemeral でエラーが返り Firestore は変更されない",
    withConfigFile({
      content: CONFIG_WITH_ROLES,
      fn: async () => {
        const incident = await seedIncident({
          responders: [
            { roleId: "commander", userId: "U000TEST", userName: "testuser" },
          ],
        });

        let ephemeralCalled = false;
        server.use(
          http.post(
            "https://slack.com/api/chat.postEphemeral",
            async ({ request }) => {
              const params = new URLSearchParams(await request.text());
              const text = params.get("text") ?? "";
              if (text.includes("既にアサイン済み")) {
                ephemeralCalled = true;
              }
              return HttpResponse.json({ ok: true });
            },
          ),
        );

        const payload = buildAssignRolePayload({
          actionId: "assign_role_commander",
          channelId: INCIDENT_CHANNEL_ID,
        });
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
        await new Promise((r) => setTimeout(r, 100));

        // ephemeral が返される
        expect(ephemeralCalled).toBe(true);

        // Firestore の responders は変更されない（1件のまま）
        const snap = await incidentsCol.doc(incident.id).get();
        const data = snap.data();
        expect(data?.responders).toHaveLength(1);
      },
    }),
  );

  it(
    "インシデント宣言後、welcomeMessageTs が Firestore に保存される",
    withConfigFile({
      content: CONFIG_WITH_ROLES,
      fn: async () => {
        const CREATED_INCIDENT_CHANNEL = "C_INC_NEW";
        const EXPECTED_WELCOME_TS = "1800000000.000001";

        server.use(
          http.post("https://slack.com/api/conversations.create", () => {
            return HttpResponse.json({
              ok: true,
              channel: { id: CREATED_INCIDENT_CHANNEL, name: "inc-20260322-001" },
            });
          }),
          http.post(
            "https://slack.com/api/chat.postMessage",
            async ({ request }) => {
              const params = new URLSearchParams(await request.text());
              const channel = params.get("channel");
              // インシデントチャンネルへのウェルカムメッセージには専用 ts を返す
              if (channel === CREATED_INCIDENT_CHANNEL) {
                return HttpResponse.json({
                  ok: true,
                  ts: EXPECTED_WELCOME_TS,
                });
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
        await new Promise((r) => setTimeout(r, 200));

        const snap = await incidentsCol.where("incidentChannelId", "==", CREATED_INCIDENT_CHANNEL).get();
        expect(snap.docs).toHaveLength(1);
        const data = snap.docs[0]?.data();
        expect(data?.welcomeMessageTs).toBe(EXPECTED_WELCOME_TS);
      },
    }),
  );
});
