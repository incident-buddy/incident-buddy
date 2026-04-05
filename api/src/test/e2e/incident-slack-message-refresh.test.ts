import { Timestamp } from "firebase-admin/firestore";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db, incidentsCol } from "../../db/firestore.js";
import type { IncidentDoc } from "../../db/types.js";
import { incidentService } from "../../features/incident/incident.service.js";
import { boltApp } from "../../slack/app.js";
import { makeSlackAdapter } from "../../slack/handlers/actions.js";
import { server } from "../setup.js";

const SLACK_CHANNEL_ID = "C_ORIGINAL_CHANNEL";
const INCIDENT_CHANNEL_ID = "C_INC_CHANNEL";
const SLACK_MESSAGE_TS = "1700000000.000001";

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

async function getIncident(id: string) {
  const incident = await incidentService.findById(id);
  if (!incident) throw new Error(`Incident not found: ${id}`);
  return incident;
}

describe("makeSlackAdapter().refreshIncidentMessage", () => {
  beforeEach(clearIncidents);
  afterEach(() => {
    server.resetHandlers();
  });

  it("slackMessageTs が設定されているインシデントに対して chat.update が呼ばれる", async () => {
    const doc = await seedIncident();
    const incident = await getIncident(doc.id);

    let capturedChannel: string | null = null;
    let capturedTs: string | null = null;
    server.use(
      http.post("https://slack.com/api/chat.update", async ({ request }) => {
        const params = new URLSearchParams(await request.text());
        capturedChannel = params.get("channel");
        capturedTs = params.get("ts");
        return HttpResponse.json({ ok: true, ts: SLACK_MESSAGE_TS });
      }),
    );

    await makeSlackAdapter(boltApp.client).refreshIncidentMessage(incident);

    expect(capturedChannel).toBe(SLACK_CHANNEL_ID);
    expect(capturedTs).toBe(SLACK_MESSAGE_TS);
  });

  it("更新メッセージに現在のインシデント情報（title・severity・status）が含まれる", async () => {
    const doc = await seedIncident({
      title: "API Outage",
      severity: "P2",
      status: "open",
    });
    const incident = await getIncident(doc.id);

    let capturedBody = "";
    server.use(
      http.post("https://slack.com/api/chat.update", async ({ request }) => {
        const params = new URLSearchParams(await request.text());
        capturedBody = JSON.stringify(Object.fromEntries(params));
        return HttpResponse.json({ ok: true, ts: SLACK_MESSAGE_TS });
      }),
    );

    await makeSlackAdapter(boltApp.client).refreshIncidentMessage(incident);

    expect(capturedBody).toContain("API Outage");
    expect(capturedBody).toContain("P2");
    expect(capturedBody).toContain("open");
  });

  it("incidentChannelId がある場合、更新メッセージにチャンネルリンクが含まれる", async () => {
    const doc = await seedIncident({
      incidentChannelId: INCIDENT_CHANNEL_ID,
    });
    const incident = await getIncident(doc.id);

    let capturedBody = "";
    server.use(
      http.post("https://slack.com/api/chat.update", async ({ request }) => {
        const params = new URLSearchParams(await request.text());
        capturedBody = JSON.stringify(Object.fromEntries(params));
        return HttpResponse.json({ ok: true, ts: SLACK_MESSAGE_TS });
      }),
    );

    await makeSlackAdapter(boltApp.client).refreshIncidentMessage(incident);

    expect(capturedBody).toContain(INCIDENT_CHANNEL_ID);
  });

  it("slackMessageTs が空文字の場合、chat.update が呼ばれない", async () => {
    const doc = await seedIncident({ slackMessageTs: "" });
    const incident = await getIncident(doc.id);

    let updateCalled = false;
    server.use(
      http.post("https://slack.com/api/chat.update", () => {
        updateCalled = true;
        return HttpResponse.json({ ok: true });
      }),
    );

    await makeSlackAdapter(boltApp.client).refreshIncidentMessage(incident);

    expect(updateCalled).toBe(false);
  });

  it("chat.update が ok: false を返した場合、エラーをスローする", async () => {
    const doc = await seedIncident();
    const incident = await getIncident(doc.id);

    server.use(
      http.post("https://slack.com/api/chat.update", () => {
        return HttpResponse.json({ ok: false, error: "message_not_found" });
      }),
    );

    await expect(
      makeSlackAdapter(boltApp.client).refreshIncidentMessage(incident),
    ).rejects.toThrow("message_not_found");
  });
});
