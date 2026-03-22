import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../db/firestore.js";
import { app } from "../../index.js";
import { signSlackRequest } from "../helpers/slack-request.js";
import { server } from "../setup.js";

const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET ?? "";
const INCIDENT_CHANNEL_ID = "C_INC_CHANNEL";

async function clearIncidents() {
  const snap = await db.collection("incidents").get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
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

// channel: なしの新フォーマット設定
const CONFIG = `# Incident Config

## Severities

### Critical
本番サービスが完全停止している

### High
本番サービスが部分的に影響を受けている

### Medium
機能の一部が劣化している

### Low
軽微な問題

## Services

### payment-api
決済処理サービス

### user-service
ユーザー管理サービス

## Notification Rules

### Payment High or Above
- severity: >= High
- service: payment-api
- mention: @UPAYLEAD

### All Critical
- severity: Critical
- mention: @UONCALLMGR

### Platform Any Severity
- service: user-service
- mention: @UPLATFORM
`;

function buildCreateIncidentPayload({
  severity,
  serviceName,
}: {
  severity: string;
  serviceName: string;
}) {
  return {
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
                value: severity,
                text: { type: "plain_text", text: severity },
              },
            },
          },
          service: {
            service_select: {
              type: "static_select",
              selected_option: serviceName
                ? {
                    value: serviceName,
                    text: { type: "plain_text", text: serviceName },
                  }
                : null,
            },
          },
          description: {
            description_input: { type: "plain_text_input", value: "" },
          },
        },
      },
    },
  };
}

async function submitCreateIncident({
  severity,
  serviceName = "",
}: {
  severity: string;
  serviceName?: string;
}) {
  const payload = buildCreateIncidentPayload({ severity, serviceName });
  const body = new URLSearchParams({
    payload: JSON.stringify(payload),
  }).toString();
  const headers = signSlackRequest({ body, signingSecret: SIGNING_SECRET });
  return app.request("/slack/interactions", { method: "POST", headers, body });
}

describe("インシデントチャンネル招待通知", () => {
  beforeEach(() => {
    clearIncidents();
    server.use(
      http.post("https://slack.com/api/conversations.create", () => {
        return HttpResponse.json({
          ok: true,
          channel: { id: INCIDENT_CHANNEL_ID, name: "inc-20260322-001" },
        });
      }),
    );
  });
  afterEach(async () => {
    server.resetHandlers();
    delete process.env.INCIDENT_CONFIG_PATH;
    await clearIncidents();
  });

  it(
    "マッチしたユーザーにインシデントチャンネルで '<@userId> を招待しました' が投稿される",
    withConfigFile({
      content: CONFIG,
      fn: async () => {
        const incidentChannelPosts: string[] = [];
        const externalChannelPosts: string[] = [];

        // UPAYLEAD と UONCALLMGR の招待通知を待つ（2通）
        let resolveInviteNotifications!: () => void;
        const inviteNotificationsDone = new Promise<void>(
          (r) => (resolveInviteNotifications = r),
        );
        let inviteNotificationCount = 0;

        server.use(
          http.post(
            "https://slack.com/api/chat.postMessage",
            async ({ request }) => {
              const params = new URLSearchParams(await request.text());
              const channel = params.get("channel") ?? "";
              const text = params.get("text") ?? "";
              if (channel === INCIDENT_CHANNEL_ID) {
                incidentChannelPosts.push(text);
                if (text.includes("を招待しました")) {
                  inviteNotificationCount++;
                  if (inviteNotificationCount >= 2) resolveInviteNotifications();
                }
              } else if (channel !== "C000TEST") {
                externalChannelPosts.push(channel);
              }
              return HttpResponse.json({ ok: true, ts: "1000.0001", channel });
            },
          ),
        );

        const res = await submitCreateIncident({
          severity: "Critical",
          serviceName: "payment-api",
        });
        expect(res.status).toBe(200);
        await inviteNotificationsDone;

        // インシデントチャンネルに各ユーザーの招待通知が投稿される
        expect(
          incidentChannelPosts.some((t) => t.includes("<@UPAYLEAD>")),
        ).toBe(true);
        expect(
          incidentChannelPosts.some((t) => t.includes("<@UONCALLMGR>")),
        ).toBe(true);
        expect(
          incidentChannelPosts.every((t) => t.includes("を招待しました") || !t.includes("<@U")),
        ).toBe(true);

        // 外部チャンネルへの通知は投稿されない
        expect(externalChannelPosts).toHaveLength(0);
      },
    }),
  );

  it(
    "複数ルールにまたがる同一ユーザーは1回だけ招待通知が投稿される",
    withConfigFile({
      content: `# Incident Config

## Severities
### Critical
### High

## Services
### payment-api

## Notification Rules

### Rule A
- severity: Critical
- mention: @USHARED

### Rule B
- service: payment-api
- mention: @USHARED
`,
      fn: async () => {
        const inviteNotifications: string[] = [];
        let resolvePost!: () => void;
        const postDone = new Promise<void>((r) => (resolvePost = r));

        server.use(
          http.post(
            "https://slack.com/api/chat.postMessage",
            async ({ request }) => {
              const params = new URLSearchParams(await request.text());
              const channel = params.get("channel") ?? "";
              const text = params.get("text") ?? "";
              if (channel === INCIDENT_CHANNEL_ID && text.includes("を招待しました")) {
                inviteNotifications.push(text);
                resolvePost();
              }
              return HttpResponse.json({ ok: true, ts: "1000.0001", channel });
            },
          ),
        );

        const res = await submitCreateIncident({
          severity: "Critical",
          serviceName: "payment-api",
        });
        expect(res.status).toBe(200);
        await postDone;

        // USHARED は1回だけ招待通知が投稿される（重複排除）
        const sharedUserPosts = inviteNotifications.filter((t) =>
          t.includes("<@USHARED>"),
        );
        expect(sharedUserPosts).toHaveLength(1);
      },
    }),
  );

  it(
    "@channel のみのルールでは招待・招待通知が投稿されない",
    withConfigFile({
      content: `# Incident Config

## Severities
### Critical

## Notification Rules

### Broadcast Only
- severity: Critical
- mention: @channel
`,
      fn: async () => {
        const incidentChannelInviteTexts: string[] = [];
        let resolvePost!: () => void;
        const postDone = new Promise<void>((r) => (resolvePost = r));

        server.use(
          http.post(
            "https://slack.com/api/chat.postMessage",
            async ({ request }) => {
              const params = new URLSearchParams(await request.text());
              const channel = params.get("channel") ?? "";
              const text = params.get("text") ?? "";
              if (channel === INCIDENT_CHANNEL_ID && text.includes("を招待しました")) {
                incidentChannelInviteTexts.push(text);
              }
              // ウェルカムメッセージが投稿されたら完了とみなす
              if (channel === INCIDENT_CHANNEL_ID && !text.includes("を招待しました")) {
                resolvePost();
              }
              return HttpResponse.json({ ok: true, ts: "1000.0001", channel });
            },
          ),
        );

        const res = await submitCreateIncident({ severity: "Critical" });
        expect(res.status).toBe(200);
        await postDone;

        // 少し待って招待通知がないことを確認
        await new Promise((r) => setTimeout(r, 50));
        expect(incidentChannelInviteTexts).toHaveLength(0);
      },
    }),
  );

  it(
    "@S... グループIDは展開後の各ユーザーに招待通知が投稿される",
    withConfigFile({
      content: `# Incident Config

## Severities
### Critical

## Notification Rules

### Group Rule
- severity: Critical
- mention: @SGROUP123
`,
      fn: async () => {
        // グループには2ユーザーが属する
        server.use(
          http.post("https://slack.com/api/usergroups.users.list", () => {
            return HttpResponse.json({
              ok: true,
              users: ["UGROUPMEMBER1", "UGROUPMEMBER2"],
            });
          }),
        );

        const inviteNotifications: string[] = [];
        let resolveAll!: () => void;
        const allDone = new Promise<void>((r) => (resolveAll = r));
        let count = 0;

        server.use(
          http.post(
            "https://slack.com/api/chat.postMessage",
            async ({ request }) => {
              const params = new URLSearchParams(await request.text());
              const channel = params.get("channel") ?? "";
              const text = params.get("text") ?? "";
              if (channel === INCIDENT_CHANNEL_ID && text.includes("を招待しました")) {
                inviteNotifications.push(text);
                count++;
                if (count >= 2) resolveAll();
              }
              return HttpResponse.json({ ok: true, ts: "1000.0001", channel });
            },
          ),
        );

        const res = await submitCreateIncident({ severity: "Critical" });
        expect(res.status).toBe(200);
        await allDone;

        // グループの各メンバーに個別投稿される
        expect(
          inviteNotifications.some((t) => t.includes("<@UGROUPMEMBER1>")),
        ).toBe(true);
        expect(
          inviteNotifications.some((t) => t.includes("<@UGROUPMEMBER2>")),
        ).toBe(true);
      },
    }),
  );

  it(
    "招待通知 chat.postMessage 失敗時はログのみで次のユーザーの投稿に進む",
    withConfigFile({
      content: `# Incident Config

## Severities
### Critical

## Notification Rules

### Multi User
- severity: Critical
- mention: @UFAILUSER @UOKUSER
`,
      fn: async () => {
        const postedInviteTexts: string[] = [];
        let resolveOkUser!: () => void;
        const okUserDone = new Promise<void>((r) => (resolveOkUser = r));

        let firstInviteAttempt = true;

        server.use(
          http.post(
            "https://slack.com/api/chat.postMessage",
            async ({ request }) => {
              const params = new URLSearchParams(await request.text());
              const channel = params.get("channel") ?? "";
              const text = params.get("text") ?? "";

              if (channel === INCIDENT_CHANNEL_ID && text.includes("を招待しました")) {
                if (firstInviteAttempt) {
                  // 最初のユーザーへの投稿を失敗させる
                  firstInviteAttempt = false;
                  return HttpResponse.json({
                    ok: false,
                    error: "channel_not_found",
                  });
                }
                // 2番目のユーザーは成功
                postedInviteTexts.push(text);
                resolveOkUser();
              }
              return HttpResponse.json({ ok: true, ts: "1000.0001", channel });
            },
          ),
        );

        const res = await submitCreateIncident({ severity: "Critical" });
        expect(res.status).toBe(200);
        await okUserDone;

        // 失敗しても次のユーザーへの投稿は実行される
        expect(postedInviteTexts).toHaveLength(1);
      },
    }),
  );

  it(
    "設定ファイルなしの場合は招待・招待通知なし",
    async () => {
      const inviteNotifications: string[] = [];
      let resolveWelcome!: () => void;
      const welcomeDone = new Promise<void>((r) => (resolveWelcome = r));

      server.use(
        http.post(
          "https://slack.com/api/chat.postMessage",
          async ({ request }) => {
            const params = new URLSearchParams(await request.text());
            const channel = params.get("channel") ?? "";
            const text = params.get("text") ?? "";
            if (channel === INCIDENT_CHANNEL_ID && text.includes("を招待しました")) {
              inviteNotifications.push(text);
            }
            if (channel === INCIDENT_CHANNEL_ID) {
              resolveWelcome();
            }
            return HttpResponse.json({ ok: true, ts: "1000.0001", channel });
          },
        ),
      );

      const res = await submitCreateIncident({ severity: "Critical" });
      expect(res.status).toBe(200);
      await welcomeDone;
      await new Promise((r) => setTimeout(r, 50));

      expect(inviteNotifications).toHaveLength(0);
    },
  );
});
