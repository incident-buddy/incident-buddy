import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../db/firestore.js";
import { app } from "../../index.js";
import { signSlackRequest } from "../helpers/slack-request.js";
import { server } from "../setup.js";

const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET!;

async function clearIncidents() {
  const snap = await db.collection("incidents").get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

function withConfigFile(content: string, fn: () => Promise<void>) {
  return async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "incident-channel-test-"));
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

function buildCreateIncidentPayload(opts: { severity?: string; channelId?: string } = {}) {
  const { severity = "P1", channelId = "C000TEST" } = opts;
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
          title: { title_input: { type: "plain_text_input", value: "DB is down" } },
          severity: {
            severity_select: {
              type: "static_select",
              selected_option: { value: severity, text: { type: "plain_text", text: severity } },
            },
          },
        },
      },
    },
  };
  const body = new URLSearchParams({ payload: JSON.stringify(payload) }).toString();
  return { body, headers: signSlackRequest(body, SIGNING_SECRET) };
}

async function submitCreateIncident(opts: { severity?: string; channelId?: string } = {}) {
  const { body, headers } = buildCreateIncidentPayload(opts);
  return app.request("/slack/interactions", { method: "POST", headers, body });
}

// 通知ルールにユーザーIDを含む設定
const CONFIG_WITH_USER_MENTIONS = `# Incident Config

## Severities

### P1
Critical

## Notification Rules

### Notify P1
- severity: P1
- channel: #incidents
- mention: @here @UA12345 @UB67890
`;

// 通知ルールにグループIDを含む設定
const CONFIG_WITH_GROUP_MENTION = `# Incident Config

## Severities

### P1
Critical

## Notification Rules

### Notify P1
- severity: P1
- channel: #incidents
- mention: @SGROUP1
`;

// 複数ルールで同じユーザーIDが出現する設定
const CONFIG_WITH_DUPLICATE_USERS = `# Incident Config

## Severities

### P1
Critical

## Notification Rules

### Rule 1
- severity: P1
- channel: #incidents
- mention: @UA12345 @UB67890

### Rule 2
- severity: P1
- channel: #oncall
- mention: @UA12345 @UC99999
`;

describe("インシデントチャンネル自動作成・招待", () => {
  beforeEach(clearIncidents);
  afterEach(async () => {
    server.resetHandlers();
    vi.restoreAllMocks();
    delete process.env.INCIDENT_CONFIG_PATH;
    await clearIncidents();
  });

  describe("チャンネル作成", () => {
    it(
      "インシデント宣言時に inc-YYYYMMDD-NNN 形式のパブリックチャンネルが作成される",
      withConfigFile(CONFIG_WITH_USER_MENTIONS, async () => {
        let capturedChannelName: string | undefined;
        let resolveCreate!: () => void;
        const createCalled = new Promise<void>((r) => {
          resolveCreate = r;
        });

        server.use(
          http.post("https://slack.com/api/conversations.create", async ({ request }) => {
            const params = new URLSearchParams(await request.text());
            capturedChannelName = params.get("name") ?? undefined;
            resolveCreate();
            return HttpResponse.json({
              ok: true,
              channel: { id: "C_INC_001", name: capturedChannelName },
            });
          }),
          http.post("https://slack.com/api/conversations.invite", () =>
            HttpResponse.json({ ok: true }),
          ),
        );

        const res = await submitCreateIncident();
        expect(res.status).toBe(200);
        await createCalled;
        expect(capturedChannelName).toMatch(/^inc-\d{8}-\d{3}$/);
      }),
    );

    it(
      "チャンネル名が重複（name_taken）する場合、連番を増やして再作成される",
      withConfigFile(CONFIG_WITH_USER_MENTIONS, async () => {
        const createdNames: string[] = [];
        let callCount = 0;
        let resolveSecondCreate!: () => void;
        const secondCreateDone = new Promise<void>((r) => {
          resolveSecondCreate = r;
        });

        server.use(
          http.post("https://slack.com/api/conversations.create", async ({ request }) => {
            const params = new URLSearchParams(await request.text());
            const name = params.get("name") ?? "";
            createdNames.push(name);
            callCount++;
            if (callCount === 1) {
              return HttpResponse.json({ ok: false, error: "name_taken" });
            }
            resolveSecondCreate();
            return HttpResponse.json({ ok: true, channel: { id: "C_INC_002", name } });
          }),
          http.post("https://slack.com/api/conversations.invite", () =>
            HttpResponse.json({ ok: true }),
          ),
        );

        const res = await submitCreateIncident();
        expect(res.status).toBe(200);
        await secondCreateDone;
        expect(callCount).toBeGreaterThanOrEqual(2);
        // 2回目の名前は1回目と異なる（連番が増えている）
        expect(createdNames[0]).not.toBe(createdNames[1]);
      }),
    );

    it(
      "チャンネル作成失敗時は postError でエラーを投稿し、通知処理をスキップする",
      withConfigFile(CONFIG_WITH_USER_MENTIONS, async () => {
        server.use(
          http.post("https://slack.com/api/conversations.create", () =>
            HttpResponse.json({ ok: false, error: "internal_error" }),
          ),
        );

        const inviteSpy = vi.fn();
        server.use(
          http.post("https://slack.com/api/conversations.invite", () => {
            inviteSpy();
            return HttpResponse.json({ ok: true });
          }),
        );

        let capturedErrorText: string | undefined;
        let resolveError!: () => void;
        const errorCalled = new Promise<void>((r) => {
          resolveError = r;
        });
        const postedChannels: string[] = [];

        server.use(
          http.post("https://slack.com/api/chat.postMessage", async ({ request }) => {
            const params = new URLSearchParams(await request.text());
            const text = params.get("text") ?? "";
            const channel = params.get("channel") ?? "";
            postedChannels.push(channel);
            capturedErrorText = text;
            resolveError();
            return HttpResponse.json({ ok: true, ts: "1000.0001", channel });
          }),
        );

        const res = await submitCreateIncident();
        expect(res.status).toBe(200);
        await errorCalled;
        // 非同期の残処理が完了するまで待機してから検証
        await new Promise((r) => setTimeout(r, 50));

        // エラーメッセージが元チャンネル（C000TEST）に投稿される
        expect(postedChannels).toContain("C000TEST");
        expect(capturedErrorText).toMatch(/コマンドの実行に失敗しました/);
        // チャンネル作成失敗後は通知ループに到達しないため投稿は1回のみ
        expect(postedChannels).toHaveLength(1);
        expect(postedChannels).not.toContain("#incidents");
        // 招待も行われない
        expect(inviteSpy).not.toHaveBeenCalled();
      }),
    );
  });

  describe("ユーザー招待", () => {
    it(
      "通知ルールの @U.../@W... メンションのユーザーが作成チャンネルに招待される",
      withConfigFile(CONFIG_WITH_USER_MENTIONS, async () => {
        let capturedInviteUsers: string | undefined;
        let capturedInviteChannel: string | undefined;
        let resolveInvite!: () => void;
        const inviteCalled = new Promise<void>((r) => {
          resolveInvite = r;
        });

        server.use(
          http.post("https://slack.com/api/conversations.create", () =>
            HttpResponse.json({
              ok: true,
              channel: { id: "C_INC_001", name: "inc-20260321-001" },
            }),
          ),
          http.post("https://slack.com/api/conversations.invite", async ({ request }) => {
            const params = new URLSearchParams(await request.text());
            capturedInviteUsers = params.get("users") ?? undefined;
            capturedInviteChannel = params.get("channel") ?? undefined;
            resolveInvite();
            return HttpResponse.json({ ok: true });
          }),
        );

        const res = await submitCreateIncident();
        expect(res.status).toBe(200);
        await inviteCalled;

        // 作成したチャンネルに招待される
        expect(capturedInviteChannel).toBe("C_INC_001");
        // @UA12345, @UB67890 が招待される（@ を除いた ID）
        expect(capturedInviteUsers).toContain("UA12345");
        expect(capturedInviteUsers).toContain("UB67890");
        // @here は招待されない
        expect(capturedInviteUsers).not.toContain("here");
      }),
    );

    it(
      "通知ルールの @S... グループのメンバーが作成チャンネルに招待される",
      withConfigFile(CONFIG_WITH_GROUP_MENTION, async () => {
        let capturedInviteUsers: string | undefined;
        let resolveInvite!: () => void;
        const inviteCalled = new Promise<void>((r) => {
          resolveInvite = r;
        });

        server.use(
          http.post("https://slack.com/api/conversations.create", () =>
            HttpResponse.json({
              ok: true,
              channel: { id: "C_INC_001", name: "inc-20260321-001" },
            }),
          ),
          http.post("https://slack.com/api/usergroups.users.list", async ({ request }) => {
            const params = new URLSearchParams(await request.text());
            const usergroup = params.get("usergroup");
            expect(usergroup).toBe("SGROUP1");
            return HttpResponse.json({ ok: true, users: ["U_MEMBER1", "U_MEMBER2"] });
          }),
          http.post("https://slack.com/api/conversations.invite", async ({ request }) => {
            const params = new URLSearchParams(await request.text());
            capturedInviteUsers = params.get("users") ?? undefined;
            resolveInvite();
            return HttpResponse.json({ ok: true });
          }),
        );

        const res = await submitCreateIncident();
        expect(res.status).toBe(200);
        await inviteCalled;
        expect(capturedInviteUsers).toContain("U_MEMBER1");
        expect(capturedInviteUsers).toContain("U_MEMBER2");
      }),
    );

    it(
      "@here / @channel は招待に使われない（通知メッセージへのメンションは維持）",
      withConfigFile(
        `# Incident Config\n## Severities\n### P1\nCritical\n## Notification Rules\n### Rule\n- severity: P1\n- channel: #incidents\n- mention: @here @channel\n`,
        async () => {
          server.use(
            http.post("https://slack.com/api/conversations.create", () =>
              HttpResponse.json({
                ok: true,
                channel: { id: "C_INC_001", name: "inc-20260321-001" },
              }),
            ),
          );
          const inviteSpy = vi.fn();
          server.use(
            http.post("https://slack.com/api/conversations.invite", () => {
              inviteSpy();
              return HttpResponse.json({ ok: true });
            }),
          );

          const postedMessages: string[] = [];
          let notifyCount = 0;
          const allPosted = new Promise<void>((resolve) => {
            server.use(
              http.post("https://slack.com/api/chat.postMessage", async ({ request }) => {
                const params = new URLSearchParams(await request.text());
                postedMessages.push(params.get("text") ?? "");
                notifyCount++;
                if (notifyCount >= 2) resolve();
                return HttpResponse.json({ ok: true, ts: "1000.0001", channel: "C000TEST" });
              }),
            );
          });

          const res = await submitCreateIncident();
          expect(res.status).toBe(200);
          await allPosted;

          // 招待は行われない
          expect(inviteSpy).not.toHaveBeenCalled();
          // 通知メッセージには @here / @channel が含まれる（メンションは維持）
          const notifyText = postedMessages.find((t) => t.includes("Incident declared:")) ?? "";
          expect(notifyText).toMatch(/@here|@channel/);
        },
      ),
    );

    it(
      "複数ルールで同じユーザーIDが指定された場合、重複排除して1回だけ招待される",
      withConfigFile(CONFIG_WITH_DUPLICATE_USERS, async () => {
        const inviteUsersList: string[] = [];
        let inviteCallCount = 0;
        let resolveInvite!: () => void;
        const inviteDone = new Promise<void>((r) => {
          resolveInvite = r;
        });

        server.use(
          http.post("https://slack.com/api/conversations.create", () =>
            HttpResponse.json({
              ok: true,
              channel: { id: "C_INC_001", name: "inc-20260321-001" },
            }),
          ),
          http.post("https://slack.com/api/conversations.invite", async ({ request }) => {
            const params = new URLSearchParams(await request.text());
            inviteUsersList.push(params.get("users") ?? "");
            inviteCallCount++;
            resolveInvite();
            return HttpResponse.json({ ok: true });
          }),
        );

        const res = await submitCreateIncident();
        expect(res.status).toBe(200);
        await inviteDone;

        // invite は1回のみ
        expect(inviteCallCount).toBe(1);
        // UA12345 は重複なく1回のみ含まれる
        const usersStr = inviteUsersList[0]!;
        const usersList = usersStr.split(",");
        expect(usersList.filter((u) => u === "UA12345")).toHaveLength(1);
        expect(usersStr).toContain("UB67890");
        expect(usersStr).toContain("UC99999");
      }),
    );

    it(
      "グループメンバー取得失敗時は該当グループをスキップし、他の招待対象は処理を続行する",
      withConfigFile(
        `# Incident Config\n## Severities\n### P1\nCritical\n## Notification Rules\n### Rule\n- severity: P1\n- channel: #incidents\n- mention: @SBAD_GROUP @UA12345\n`,
        async () => {
          let capturedInviteUsers: string | undefined;
          let resolveInvite!: () => void;
          const inviteCalled = new Promise<void>((r) => {
            resolveInvite = r;
          });

          server.use(
            http.post("https://slack.com/api/conversations.create", () =>
              HttpResponse.json({
                ok: true,
                channel: { id: "C_INC_001", name: "inc-20260321-001" },
              }),
            ),
            http.post("https://slack.com/api/usergroups.users.list", () =>
              HttpResponse.json({ ok: false, error: "no_such_subteam" }),
            ),
            http.post("https://slack.com/api/conversations.invite", async ({ request }) => {
              const params = new URLSearchParams(await request.text());
              capturedInviteUsers = params.get("users") ?? undefined;
              resolveInvite();
              return HttpResponse.json({ ok: true });
            }),
          );

          const res = await submitCreateIncident();
          expect(res.status).toBe(200);
          await inviteCalled;
          // @SBAD_GROUP はスキップされ @UA12345 のみ招待される
          expect(capturedInviteUsers).toBe("UA12345");
        },
      ),
    );

    it(
      "招待失敗時は処理を止めず、コンソールにエラーログを出力する",
      withConfigFile(CONFIG_WITH_USER_MENTIONS, async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        let postMessageCallCount = 0;
        let resolvePost!: () => void;
        // 元チャンネル(C000TEST) + #incidents の2回
        const allPosted = new Promise<void>((r) => {
          resolvePost = r;
        });

        server.use(
          http.post("https://slack.com/api/conversations.create", () =>
            HttpResponse.json({
              ok: true,
              channel: { id: "C_INC_001", name: "inc-20260321-001" },
            }),
          ),
          http.post("https://slack.com/api/conversations.invite", () =>
            HttpResponse.json({ ok: false, error: "cant_invite_self" }),
          ),
          http.post("https://slack.com/api/chat.postMessage", async () => {
            postMessageCallCount++;
            if (postMessageCallCount >= 2) resolvePost();
            return HttpResponse.json({ ok: true, ts: "1000.0001", channel: "C000TEST" });
          }),
        );

        const res = await submitCreateIncident();
        expect(res.status).toBe(200);
        await allPosted;

        // クラッシュしない（postMessage は通常通り実行される）
        expect(postMessageCallCount).toBeGreaterThanOrEqual(1);
        // 招待失敗のエラーログが出力される
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining("[incident-buddy] Failed to invite users to incident channel:"),
          expect.anything(),
        );
      }),
    );
  });

  describe("通知メッセージへのチャンネルリンク", () => {
    it(
      "通知チャンネルの通知メッセージにインシデントチャンネルリンクが含まれる",
      withConfigFile(CONFIG_WITH_USER_MENTIONS, async () => {
        server.use(
          http.post("https://slack.com/api/conversations.create", () =>
            HttpResponse.json({
              ok: true,
              channel: { id: "C_INC_LINK", name: "inc-20260321-001" },
            }),
          ),
          http.post("https://slack.com/api/conversations.invite", () =>
            HttpResponse.json({ ok: true }),
          ),
        );

        const notificationTexts: string[] = [];
        let notifyCount = 0;
        const allPosted = new Promise<void>((resolve) => {
          server.use(
            http.post("https://slack.com/api/chat.postMessage", async ({ request }) => {
              const params = new URLSearchParams(await request.text());
              const text = params.get("text") ?? "";
              notificationTexts.push(text);
              notifyCount++;
              // 元チャンネル(C000TEST) + 通知ルール(#incidents) = 2回
              if (notifyCount >= 2) resolve();
              return HttpResponse.json({ ok: true, ts: "1000.0001", channel: "C000TEST" });
            }),
          );
        });

        const res = await submitCreateIncident();
        expect(res.status).toBe(200);
        await allPosted;

        // #incidents への通知メッセージにチャンネルリンクが含まれる
        const notificationText = notificationTexts.find((t) => t.includes("Incident declared:"));
        expect(notificationText).toBeDefined();
        expect(notificationText).toContain("<#C_INC_LINK>");
      }),
    );
  });
});
