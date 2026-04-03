import { Timestamp } from "firebase-admin/firestore";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db, incidentsCol } from "../../db/firestore.js";
import type { IncidentDoc } from "../../db/types.js";
import { incidentService } from "../../features/incident/incident.service.js";
import { app } from "../../index.js";
import { signSlackRequest } from "../helpers/slack-request.js";
import { server } from "../setup.js";

const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET ?? "";
const RESPONSE_URL = "https://hooks.slack.com/commands/T000TEST/list-test";

async function clearIncidents() {
  const snap = await db.collection("incidents").get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

async function seedIncident(overrides: Partial<IncidentDoc> = {}): Promise<IncidentDoc> {
  const ref = incidentsCol.doc();
  const now = Timestamp.now();
  const doc: IncidentDoc = {
    id: ref.id,
    title: "DB is down",
    description: "Primary DB not responding",
    status: "open",
    severity: "P1",
    serviceName: "payment-service",
    slackChannelId: "C_ORIGINAL",
    slackMessageTs: "1700000000.000001",
    incidentChannelId: "C_INC_001",
    welcomeMessageTs: "1700000000.000002",
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

function makeListCommand() {
  const body = new URLSearchParams({
    command: "/inc",
    trigger_id: "test-trigger-id",
    channel_id: "C000TEST",
    user_id: "U000TEST",
    user_name: "testuser",
    team_id: "T000TEST",
    response_url: RESPONSE_URL,
    text: "list",
  }).toString();
  return {
    body,
    headers: signSlackRequest({ body, signingSecret: SIGNING_SECRET }),
  };
}

function captureEphemeral() {
  let capturedText: string | undefined;
  let capturedBlocks: unknown[] | undefined;
  let resolve!: () => void;
  const called = new Promise<void>((r) => { resolve = r; });
  server.use(
    http.post(RESPONSE_URL, async ({ request }) => {
      const body = await request.json() as { text?: string; blocks?: unknown[] };
      capturedText = body.text;
      capturedBlocks = body.blocks;
      resolve();
      return HttpResponse.json({ ok: true });
    }),
  );
  return { called, getText: () => capturedText, getBlocks: () => capturedBlocks };
}

describe("POST /slack/events - /inc list command", () => {
  beforeEach(clearIncidents);
  afterEach(() => {
    server.resetHandlers();
    vi.restoreAllMocks();
  });

  it("オープン中のインシデントが0件のとき「インシデントはありません」と ephemeral 表示する", async () => {
    const { called, getText } = captureEphemeral();

    const { body, headers } = makeListCommand();
    const res = await app.request("/slack/events", { method: "POST", headers, body });

    expect(res.status).toBe(200);
    await called;
    expect(getText()).toContain("オープン中のインシデントはありません");
  });

  it("オープン中のインシデント一覧を ephemeral 表示する", async () => {
    await seedIncident({ title: "DB is down", severity: "P1", incidentChannelId: "C_INC_001" });

    const { called, getText } = captureEphemeral();

    const { body, headers } = makeListCommand();
    const res = await app.request("/slack/events", { method: "POST", headers, body });

    expect(res.status).toBe(200);
    await called;
    expect(getText()).toContain("DB is down");
    expect(getText()).toContain("P1");
    expect(getText()).toContain("testuser");
    expect(getText()).toContain("<#C_INC_001>");
  });

  it("一覧は作成日時の降順（新しい順）で表示される", async () => {
    const olderTs = Timestamp.fromDate(new Date("2026-01-01T00:00:00Z"));
    const newerTs = Timestamp.fromDate(new Date("2026-06-01T00:00:00Z"));
    await seedIncident({ title: "Older Incident", createdAt: olderTs, updatedAt: olderTs });
    await seedIncident({ title: "Newer Incident", createdAt: newerTs, updatedAt: newerTs });

    const { called, getText } = captureEphemeral();

    const { body, headers } = makeListCommand();
    await app.request("/slack/events", { method: "POST", headers, body });

    await called;
    const text = getText() ?? "";
    expect(text.indexOf("Newer Incident")).toBeLessThan(text.indexOf("Older Incident"));
  });

  it("resolved のインシデントは一覧に含まれない", async () => {
    await seedIncident({ title: "Open Incident" });
    await seedIncident({
      title: "Resolved Incident",
      status: "resolved",
      resolvedAt: Timestamp.now(),
      resolvedBy: "U000TEST",
      resolvedByName: "testuser",
    });

    const { called, getText } = captureEphemeral();

    const { body, headers } = makeListCommand();
    await app.request("/slack/events", { method: "POST", headers, body });

    await called;
    expect(getText()).toContain("Open Incident");
    expect(getText()).not.toContain("Resolved Incident");
  });

  it("findOpen() が失敗したとき ephemeral エラーを表示する", async () => {
    vi.spyOn(incidentService, "findOpen").mockRejectedValueOnce(new Error("DB unavailable"));

    const { called, getText } = captureEphemeral();

    const { body, headers } = makeListCommand();
    const res = await app.request("/slack/events", { method: "POST", headers, body });

    expect(res.status).toBe(200);
    await called;
    expect(getText()).toContain("インシデント一覧の取得に失敗しました");
  });
});
