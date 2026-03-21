import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { app } from "../../index.js";
import { signSlackRequest } from "../helpers/slack-request.js";
import { server } from "../setup.js";

const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET!;

const RESPONSE_URL = "https://hooks.slack.com/commands/T000TEST/test-response";

function makeIncCommand(text: string) {
  const body = new URLSearchParams({
    command: "/inc",
    trigger_id: "test-trigger-id",
    channel_id: "C000TEST",
    user_id: "U000TEST",
    user_name: "testuser",
    team_id: "T000TEST",
    response_url: RESPONSE_URL,
    text,
  }).toString();
  return { body, headers: signSlackRequest(body, SIGNING_SECRET) };
}

const VALID_CONFIG = `# Incident Config

## Severities

### P1
Critical

### P2
High

## Services

### payments
決済処理

## Notification Rules

### Notify Critical
- severity: P1
- channel: #incidents
- mention: @here
`;

describe("POST /slack/events - /inc command", () => {
  afterEach(() => {
    server.resetHandlers();
    delete process.env.INCIDENT_CONFIG_PATH;
  });

  it("responds 200 and calls views.open for /inc without args", async () => {
    // Bolt は ack() で HTTP レスポンスを即時返し、client.views.open() は非同期で後続実行される。
    // Promise を使って views.open が呼ばれるまで待機する。
    let resolveViewsOpen!: () => void;
    const viewsOpenCalled = new Promise<void>((resolve) => {
      resolveViewsOpen = resolve;
    });

    let capturedView: Record<string, unknown> | undefined;
    server.use(
      http.post("https://slack.com/api/views.open", async ({ request }) => {
        const params = new URLSearchParams(await request.text());
        const viewJson = params.get("view");
        if (viewJson) capturedView = JSON.parse(viewJson) as Record<string, unknown>;
        resolveViewsOpen();
        return HttpResponse.json({ ok: true, view: { id: "V000TEST" } });
      }),
    );

    const { body, headers } = makeIncCommand("");
    const res = await app.request("/slack/events", {
      method: "POST",
      headers,
      body,
    });

    expect(res.status).toBe(200);
    await viewsOpenCalled; // Bolt の非同期処理が完了するまで待つ
    expect(capturedView?.type).toBe("modal");
    expect(capturedView?.callback_id).toBe("create_incident");
  });
});

describe("POST /slack/events - /inc config command", () => {
  afterEach(() => {
    server.resetHandlers();
    delete process.env.INCIDENT_CONFIG_PATH;
  });

  function captureEphemeral() {
    let capturedText: string | undefined;
    let resolve!: () => void;
    const called = new Promise<void>((r) => { resolve = r; });
    // respond() は response_url に JSON POST する（chat.postEphemeral とは異なる）
    server.use(
      http.post(RESPONSE_URL, async ({ request }) => {
        const body = await request.json() as { text?: string };
        capturedText = body.text;
        resolve();
        return HttpResponse.json({ ok: true });
      }),
    );
    return { called, getText: () => capturedText };
  }

  it("calls chat.postEphemeral with default config when INCIDENT_CONFIG_PATH is not set", async () => {
    const { called, getText } = captureEphemeral();

    const { body, headers } = makeIncCommand("config");
    const res = await app.request("/slack/events", { method: "POST", headers, body });

    expect(res.status).toBe(200);
    await called;
    expect(getText()).toContain("no config file");
    expect(getText()).toContain("Critical");
  });

  it("calls chat.postEphemeral with full config when valid config file is set", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "inc-config-"));
    const filePath = path.join(dir, "config.md");
    fs.writeFileSync(filePath, VALID_CONFIG, "utf8");
    process.env.INCIDENT_CONFIG_PATH = filePath;

    const { called, getText } = captureEphemeral();

    const { body, headers } = makeIncCommand("config");
    const res = await app.request("/slack/events", { method: "POST", headers, body });

    expect(res.status).toBe(200);
    await called;
    expect(getText()).toContain("loaded from");
    expect(getText()).toContain("P1");
    expect(getText()).toContain("payments");
    expect(getText()).toContain("Notify Critical");
    // conditions/actions のフォーマット検証
    expect(getText()).toContain("severity==P1");
    expect(getText()).toContain("→ #incidents @here");

    fs.rmSync(dir, { recursive: true });
  });

  it("calls chat.postEphemeral with error message when config file does not exist", async () => {
    process.env.INCIDENT_CONFIG_PATH = "/nonexistent/path/config.md";

    const { called, getText } = captureEphemeral();

    const { body, headers } = makeIncCommand("config");
    const res = await app.request("/slack/events", { method: "POST", headers, body });

    expect(res.status).toBe(200);
    await called;
    expect(getText()).toContain("Load Error");
    expect(getText()).not.toContain("using defaults");
  });

  it("calls chat.postEphemeral with error message when config file has unrecognizable content", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "inc-config-"));
    const filePath = path.join(dir, "config.md");
    fs.writeFileSync(filePath, "this is not a valid incident config file", "utf8");
    process.env.INCIDENT_CONFIG_PATH = filePath;

    const { called, getText } = captureEphemeral();

    const { body, headers } = makeIncCommand("config");
    const res = await app.request("/slack/events", { method: "POST", headers, body });

    expect(res.status).toBe(200);
    await called;
    expect(getText()).toContain("Load Error");
    expect(getText()).not.toContain("using defaults");

    fs.rmSync(dir, { recursive: true });
  });

  it("displays (no condition) when notification rule has no conditions", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "inc-config-"));
    const filePath = path.join(dir, "config.md");
    fs.writeFileSync(filePath, [
      "# Incident Config",
      "",
      "## Notification Rules",
      "",
      "### Alert All",
      "- channel: #general",
    ].join("\n"), "utf8");
    process.env.INCIDENT_CONFIG_PATH = filePath;

    const { called, getText } = captureEphemeral();

    const { body, headers } = makeIncCommand("config");
    const res = await app.request("/slack/events", { method: "POST", headers, body });

    expect(res.status).toBe(200);
    await called;
    expect(getText()).toContain("(no condition)");

    fs.rmSync(dir, { recursive: true });
  });
});
