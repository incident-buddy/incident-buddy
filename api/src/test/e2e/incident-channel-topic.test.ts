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

function withConfigFile({
  content,
  fn,
}: {
  content: string;
  fn: () => Promise<void>;
}) {
  return async () => {
    const dir = fs.mkdtempSync(
      path.join(os.tmpdir(), "incident-channel-topic-test-"),
    );
    const filePath = path.join(dir, "incident-config.md");
    fs.writeFileSync(filePath, content, "utf8");
    process.env.INCIDENT_CONFIG_PATH = filePath;
    try {
      await fn();
    } finally {
      delete process.env.INCIDENT_CONFIG_PATH;
      fs.rmSync(dir, { recursive: true });
    }
  };
}

const MINIMAL_CONFIG = `# Incident Config

## Severities

### Critical
本番停止

### P1
カスタム重大度
`;

function buildCreateIncidentPayload(opts: {
  severity?: string;
  title?: string;
  channelId?: string;
}) {
  const { severity = "Critical", title = "DB is down", channelId = "C000TEST" } = opts;
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
      private_metadata: JSON.stringify({ channel_id: channelId }),
      state: {
        values: {
          title: {
            title_input: { type: "plain_text_input", value: title },
          },
          severity: {
            severity_select: {
              type: "static_select",
              selected_option: {
                value: severity,
                text: { type: "plain_text", text: severity },
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

async function seedIncident(overrides: Partial<IncidentDoc> = {}): Promise<IncidentDoc> {
  const ref = incidentsCol.doc();
  const now = Timestamp.now();
  const doc: IncidentDoc = {
    id: ref.id,
    title: "DB is down",
    description: "",
    status: "open",
    severity: "Critical",
    serviceName: "",
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

describe("インシデント作成時のチャンネルトピック設定", () => {
  beforeEach(clearIncidents);
  afterEach(() => {
    server.resetHandlers();
    delete process.env.INCIDENT_CONFIG_PATH;
  });

  it(
    "インシデント作成後、conversations.setTopic が [Critical] DB is down - 対応中 で呼ばれる",
    withConfigFile({
      content: MINIMAL_CONFIG,
      fn: async () => {
        let capturedTopic: string | null = null;
        let resolveSetTopic!: () => void;
        const setTopicCalled = new Promise<void>((r) => {
          resolveSetTopic = r;
        });

        server.use(
          http.post("https://slack.com/api/conversations.create", () =>
            HttpResponse.json({
              ok: true,
              channel: { id: INCIDENT_CHANNEL_ID, name: "inc-20260405-001" },
            }),
          ),
          http.post("https://slack.com/api/conversations.setTopic", async ({ request }) => {
            const params = new URLSearchParams(await request.text());
            capturedTopic = params.get("topic");
            resolveSetTopic();
            return HttpResponse.json({ ok: true });
          }),
        );

        const { body, headers } = buildCreateIncidentPayload({
          severity: "Critical",
          title: "DB is down",
        });
        const res = await app.request("/slack/interactions", { method: "POST", headers, body });
        expect(res.status).toBe(200);
        await setTopicCalled;

        expect(capturedTopic).toBe("[Critical] DB is down - 対応中");
      },
    }),
  );

  it(
    "ユーザー定義の severity 値（P1）がトピックにそのまま反映される",
    withConfigFile({
      content: MINIMAL_CONFIG,
      fn: async () => {
        let capturedTopic: string | null = null;
        let resolveSetTopic!: () => void;
        const setTopicCalled = new Promise<void>((r) => {
          resolveSetTopic = r;
        });

        server.use(
          http.post("https://slack.com/api/conversations.create", () =>
            HttpResponse.json({
              ok: true,
              channel: { id: INCIDENT_CHANNEL_ID, name: "inc-20260405-001" },
            }),
          ),
          http.post("https://slack.com/api/conversations.setTopic", async ({ request }) => {
            const params = new URLSearchParams(await request.text());
            capturedTopic = params.get("topic");
            resolveSetTopic();
            return HttpResponse.json({ ok: true });
          }),
        );

        const { body, headers } = buildCreateIncidentPayload({
          severity: "P1",
          title: "Payment down",
        });
        const res = await app.request("/slack/interactions", { method: "POST", headers, body });
        expect(res.status).toBe(200);
        await setTopicCalled;

        expect(capturedTopic).toBe("[P1] Payment down - 対応中");
      },
    }),
  );

  it(
    "conversations.setTopic が失敗してもインシデント作成処理は継続し Firestore にデータが書き込まれる",
    withConfigFile({
      content: MINIMAL_CONFIG,
      fn: async () => {
        let setTopicCalled = false;
        let resolveSetTopic!: () => void;
        const setTopicDone = new Promise<void>((r) => {
          resolveSetTopic = r;
        });

        server.use(
          http.post("https://slack.com/api/conversations.create", () =>
            HttpResponse.json({
              ok: true,
              channel: { id: INCIDENT_CHANNEL_ID, name: "inc-20260405-001" },
            }),
          ),
          http.post("https://slack.com/api/conversations.setTopic", () => {
            setTopicCalled = true;
            resolveSetTopic();
            return HttpResponse.json({ ok: false, error: "missing_scope" });
          }),
        );

        const { body, headers } = buildCreateIncidentPayload({ severity: "Critical", title: "DB is down" });
        const res = await app.request("/slack/interactions", { method: "POST", headers, body });
        expect(res.status).toBe(200);
        await setTopicDone;
        await new Promise((r) => setTimeout(r, 100));

        expect(setTopicCalled).toBe(true);

        // Firestore にインシデントが作成されている
        const snap = await db.collection("incidents").get();
        expect(snap.docs).toHaveLength(1);
        expect(snap.docs[0]?.data()?.title).toBe("DB is down");
      },
    }),
  );
});

describe("インシデント解決時のチャンネルトピック更新", () => {
  beforeEach(clearIncidents);
  afterEach(() => {
    server.resetHandlers();
  });

  it("解決後、conversations.setTopic が [Resolved] DB is down で呼ばれる", async () => {
    const incident = await seedIncident();

    let capturedTopic: string | null = null;
    let resolveSetTopic!: () => void;
    const setTopicCalled = new Promise<void>((r) => {
      resolveSetTopic = r;
    });

    server.use(
      http.post("https://slack.com/api/conversations.setTopic", async ({ request }) => {
        const params = new URLSearchParams(await request.text());
        capturedTopic = params.get("topic");
        resolveSetTopic();
        return HttpResponse.json({ ok: true });
      }),
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
    });
    const body = new URLSearchParams({ payload: JSON.stringify(payload) }).toString();
    const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });

    const res = await app.request("/slack/interactions", { method: "POST", headers, body });
    expect(res.status).toBe(200);
    await setTopicCalled;

    expect(capturedTopic).toBe("[Resolved] DB is down");
  });

  it("解決時に conversations.setTopic が失敗しても解決処理は継続し Firestore が resolved になる", async () => {
    const incident = await seedIncident();

    let setTopicCalled = false;
    let resolveSetTopic!: () => void;
    const setTopicDone = new Promise<void>((r) => {
      resolveSetTopic = r;
    });

    server.use(
      http.post("https://slack.com/api/conversations.setTopic", () => {
        setTopicCalled = true;
        resolveSetTopic();
        return HttpResponse.json({ ok: false, error: "missing_scope" });
      }),
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
    });
    const body = new URLSearchParams({ payload: JSON.stringify(payload) }).toString();
    const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });

    const res = await app.request("/slack/interactions", { method: "POST", headers, body });
    expect(res.status).toBe(200);
    await setTopicDone;
    await new Promise((r) => setTimeout(r, 200));

    expect(setTopicCalled).toBe(true);

    // Firestore が resolved になっている
    const snap = await incidentsCol.doc(incident.id).get();
    expect(snap.data()?.status).toBe("resolved");
  });
});
