import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../db/firestore.js";
import { app } from "../../index.js";
import { signSlackRequest } from "../helpers/slack-request.js";
import { server } from "../setup.js";

const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET!;

async function clearIncidents() {
  const snap = await db.collection("incidents").get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

function withConfigFile(content: string, fn: (filePath: string) => Promise<void>) {
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
- channel: #payment-oncall
- mention: @payment-lead

### All Critical
- severity: Critical
- channel: #incidents-critical
- mention: @here

### Platform Any Severity
- service: user-service
- channel: #user-service-alerts
`;

function buildCreateIncidentPayload(severity: string, serviceName: string) {
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
                ? { value: serviceName, text: { type: "plain_text", text: serviceName } }
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

async function submitCreateIncident(severity: string, serviceName = "") {
  const payload = buildCreateIncidentPayload(severity, serviceName);
  const body = new URLSearchParams({ payload: JSON.stringify(payload) }).toString();
  const headers = signSlackRequest(body, SIGNING_SECRET);
  return app.request("/slack/interactions", { method: "POST", headers, body });
}

describe("Notification rules from markdown config", () => {
  beforeEach(clearIncidents);
  afterEach(async () => {
    server.resetHandlers();
    delete process.env.INCIDENT_CONFIG_PATH;
    await clearIncidents();
  });

  describe("設定ファイルなし（INCIDENT_CONFIG_PATH 未設定）", () => {
    it(
      "通常フローが継続し、元チャンネルのみへ通知される",
      async () => {
        const postedChannels: string[] = [];
        let resolvePost!: () => void;
        const postCalled = new Promise<void>((r) => (resolvePost = r));

        server.use(
          http.post("https://slack.com/api/chat.postMessage", async ({ request }) => {
            const params = new URLSearchParams(await request.text());
            const channel = params.get("channel") ?? "";
            postedChannels.push(channel);
            resolvePost();
            return HttpResponse.json({ ok: true, ts: "1000.0001", channel });
          }),
        );

        const res = await submitCreateIncident("Critical");
        expect(res.status).toBe(200);
        await postCalled;

        expect(postedChannels).toEqual(["C000TEST"]);
      },
    );
  });

  describe("設定ファイルあり", () => {
    it(
      "severity: Critical + service: payment-api → 元チャンネル + #payment-oncall + #incidents-critical へ通知",
      withConfigFile(CONFIG, async () => {
        const postedChannels: string[] = [];
        const postedMentions: string[] = [];
        const allPosted = new Promise<void>((resolve) => {
          server.use(
            http.post("https://slack.com/api/chat.postMessage", async ({ request }) => {
              const params = new URLSearchParams(await request.text());
              const channel = params.get("channel") ?? "";
              const text = params.get("text") ?? "";
              postedChannels.push(channel);
              if (text) postedMentions.push(text);
              if (
                postedChannels.includes("#payment-oncall") &&
                postedChannels.includes("#incidents-critical")
              ) resolve();
              return HttpResponse.json({ ok: true, ts: "1000.0001", channel });
            }),
          );
        });

        const res = await submitCreateIncident("Critical", "payment-api");
        expect(res.status).toBe(200);
        await allPosted;

        expect(postedChannels).toContain("C000TEST");
        expect(postedChannels).toContain("#payment-oncall");
        expect(postedChannels).toContain("#incidents-critical");

        const allText = postedMentions.join(" ");
        expect(allText).toContain("@payment-lead");
        expect(allText).toContain("@here");
      }),
    );

    it(
      "severity: High + service: payment-api → #payment-oncall へ通知（Criticalルールはマッチしない）",
      withConfigFile(CONFIG, async () => {
        const postedChannels: string[] = [];
        const allPosted = new Promise<void>((resolve) => {
          server.use(
            http.post("https://slack.com/api/chat.postMessage", async ({ request }) => {
              const params = new URLSearchParams(await request.text());
              const channel = params.get("channel") ?? "";
              postedChannels.push(channel);
              if (postedChannels.includes("#payment-oncall")) resolve();
              return HttpResponse.json({ ok: true, ts: "1000.0001", channel });
            }),
          );
        });

        const res = await submitCreateIncident("High", "payment-api");
        expect(res.status).toBe(200);
        await allPosted;

        expect(postedChannels).toContain("C000TEST");
        expect(postedChannels).toContain("#payment-oncall");
        expect(postedChannels).not.toContain("#incidents-critical");
      }),
    );

    it(
      "severity: Medium + service: payment-api → どのルールにもマッチせず元チャンネルのみ",
      withConfigFile(CONFIG, async () => {
        const postedChannels: string[] = [];
        let resolvePost!: () => void;
        const postCalled = new Promise<void>((r) => (resolvePost = r));

        server.use(
          http.post("https://slack.com/api/chat.postMessage", async ({ request }) => {
            const params = new URLSearchParams(await request.text());
            const channel = params.get("channel") ?? "";
            postedChannels.push(channel);
            resolvePost();
            return HttpResponse.json({ ok: true, ts: "1000.0001", channel });
          }),
        );

        const res = await submitCreateIncident("Medium", "payment-api");
        expect(res.status).toBe(200);
        await postCalled;

        expect(postedChannels).toEqual(["C000TEST"]);
      }),
    );

    it(
      "serviceのみ条件ルール（service: user-service）が severity 問わずマッチする",
      withConfigFile(CONFIG, async () => {
        const postedChannels: string[] = [];
        const allPosted = new Promise<void>((resolve) => {
          server.use(
            http.post("https://slack.com/api/chat.postMessage", async ({ request }) => {
              const params = new URLSearchParams(await request.text());
              const channel = params.get("channel") ?? "";
              postedChannels.push(channel);
              if (postedChannels.includes("#user-service-alerts")) resolve();
              return HttpResponse.json({ ok: true, ts: "1000.0001", channel });
            }),
          );
        });

        const res = await submitCreateIncident("Low", "user-service");
        expect(res.status).toBe(200);
        await allPosted;

        expect(postedChannels).toContain("C000TEST");
        expect(postedChannels).toContain("#user-service-alerts");
      }),
    );

    it(
      "service名の大文字小文字を無視してマッチする（Payment-API → payment-api）",
      withConfigFile(CONFIG, async () => {
        const postedChannels: string[] = [];
        const allPosted = new Promise<void>((resolve) => {
          server.use(
            http.post("https://slack.com/api/chat.postMessage", async ({ request }) => {
              const params = new URLSearchParams(await request.text());
              const channel = params.get("channel") ?? "";
              postedChannels.push(channel);
              if (postedChannels.includes("#payment-oncall")) resolve();
              return HttpResponse.json({ ok: true, ts: "1000.0001", channel });
            }),
          );
        });

        const res = await submitCreateIncident("High", "Payment-API");
        expect(res.status).toBe(200);
        await allPosted;

        expect(postedChannels).toContain("#payment-oncall");
      }),
    );

    it(
      "設定ファイルが存在しない場合は通常フロー継続",
      async () => {
        process.env.INCIDENT_CONFIG_PATH = "/nonexistent/path/incident-config.md";

        const postedChannels: string[] = [];
        let resolvePost!: () => void;
        const postCalled = new Promise<void>((r) => (resolvePost = r));

        server.use(
          http.post("https://slack.com/api/chat.postMessage", async ({ request }) => {
            const params = new URLSearchParams(await request.text());
            const channel = params.get("channel") ?? "";
            postedChannels.push(channel);
            resolvePost();
            return HttpResponse.json({ ok: true, ts: "1000.0001", channel });
          }),
        );

        const res = await submitCreateIncident("Critical");
        expect(res.status).toBe(200);
        await postCalled;

        expect(postedChannels).toEqual(["C000TEST"]);
      },
    );
  });

  describe("/inc コマンド - モーダルの動的生成", () => {
    it(
      "設定ファイルのseverityがモーダルの選択肢に含まれる",
      withConfigFile(CONFIG, async () => {
        let capturedView: unknown;
        let resolveOpen!: () => void;
        const viewsOpenCalled = new Promise<void>((r) => (resolveOpen = r));

        server.use(
          http.post("https://slack.com/api/views.open", async ({ request }) => {
            const params = new URLSearchParams(await request.text());
            const viewJson = params.get("view") ?? "{}";
            capturedView = JSON.parse(viewJson);
            resolveOpen();
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
        const res = await app.request("/slack/events", { method: "POST", headers, body });

        expect(res.status).toBe(200);
        await viewsOpenCalled;

        const viewStr = JSON.stringify(capturedView);
        // labels
        expect(viewStr).toContain("Critical");
        expect(viewStr).toContain("High");
        expect(viewStr).toContain("Medium");
        expect(viewStr).toContain("Low");
        expect(viewStr).toContain("payment-api");
        expect(viewStr).toContain("user-service");
        // descriptions
        expect(viewStr).toContain("本番サービスが完全停止している");
        expect(viewStr).toContain("決済処理サービス");
      }),
    );

    it(
      "<= 演算子ルール: severity: Low でマッチし、High ではマッチしない",
      withConfigFile(
        `# Config
## Severities
### Critical
### High
### Medium
### Low
## Notification Rules
### Low and Below
- severity: <= Medium
- channel: #low-priority
`,
        async () => {
          // Low → マッチ → #low-priority へ通知
          const lowChannels: string[] = [];
          const lowDone = new Promise<void>((resolve) => {
            server.use(
              http.post("https://slack.com/api/chat.postMessage", async ({ request }) => {
                const params = new URLSearchParams(await request.text());
                const channel = params.get("channel") ?? "";
                lowChannels.push(channel);
                if (lowChannels.includes("#low-priority")) resolve();
                return HttpResponse.json({ ok: true, ts: "1000.0001", channel });
              }),
            );
          });

          const res = await submitCreateIncident("Low");
          expect(res.status).toBe(200);
          await lowDone;
          expect(lowChannels).toContain("#low-priority");

          server.resetHandlers();

          // High → マッチしない → 元チャンネルのみ1回
          const highChannels: string[] = [];
          let resolveHigh!: () => void;
          const highDone = new Promise<void>((r) => (resolveHigh = r));
          server.use(
            http.post("https://slack.com/api/chat.postMessage", async ({ request }) => {
              const params = new URLSearchParams(await request.text());
              const channel = params.get("channel") ?? "";
              highChannels.push(channel);
              resolveHigh();
              return HttpResponse.json({ ok: true, ts: "1000.0001", channel });
            }),
          );

          const res2 = await submitCreateIncident("High");
          expect(res2.status).toBe(200);
          await highDone;
          expect(highChannels).not.toContain("#low-priority");
        },
      ),
    );
  });
});
