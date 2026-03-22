import { afterEach, describe, expect, it } from "vitest";
import { db } from "../../db/firestore.js";
import { incidentRepository } from "./incident.repository.js";

async function clearIncidents() {
  const snap = await db.collection("incidents").get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

const baseInput = {
  title: "DB is down",
  description: "Primary DB not responding",
  severity: "P1",
  serviceName: "",
  slackChannelId: "C000TEST",
  slackMessageTs: "",
  createdBy: "U000TEST",
  createdByName: "testuser",
  teamIds: [],
  serviceIds: [],
  responders: [],
};

describe("incidentRepository.create", () => {
  afterEach(clearIncidents);

  it("returns an Incident with a generated id and status=open", async () => {
    const incident = await incidentRepository.create(baseInput);

    expect(incident.id).toBeTruthy();
    expect(incident.status).toBe("open");
    expect(incident.title).toBe("DB is down");
    expect(incident.severity).toBe("P1");
  });

  it("returns Date instances for timestamp fields", async () => {
    const incident = await incidentRepository.create(baseInput);

    expect(incident.createdAt).toBeInstanceOf(Date);
    expect(incident.updatedAt).toBeInstanceOf(Date);
    expect(incident.resolvedAt).toBeNull();
  });
});

describe("incidentRepository.findById", () => {
  afterEach(clearIncidents);

  it("returns the incident when it exists", async () => {
    const created = await incidentRepository.create(baseInput);
    const found = await incidentRepository.findById(created.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.createdAt).toBeInstanceOf(Date);
  });

  it("returns null when the incident does not exist", async () => {
    const result = await incidentRepository.findById("nonexistent-id");
    expect(result).toBeNull();
  });
});

describe("incidentRepository.findOpen", () => {
  afterEach(clearIncidents);

  it("returns open incidents ordered by createdAt desc", async () => {
    await incidentRepository.create({ ...baseInput, title: "First" });
    await incidentRepository.create({ ...baseInput, title: "Second" });

    const incidents = await incidentRepository.findOpen();

    expect(incidents).toHaveLength(2);
    expect(incidents[0]?.createdAt.getTime()).toBeGreaterThanOrEqual(
      incidents[1]?.createdAt.getTime() ?? 0,
    );
  });

  it("excludes resolved incidents", async () => {
    const open = await incidentRepository.create({
      ...baseInput,
      title: "Open",
    });
    const toResolve = await incidentRepository.create({
      ...baseInput,
      title: "Resolved",
    });
    await incidentRepository.resolve(toResolve.id, new Date(), "U_TEST", "testuser");

    const incidents = await incidentRepository.findOpen();

    expect(incidents).toHaveLength(1);
    expect(incidents[0]?.id).toBe(open.id);
  });
});

describe("incidentRepository.updateIncidentChannelId", () => {
  afterEach(clearIncidents);

  it("updates the incidentChannelId field", async () => {
    const incident = await incidentRepository.create(baseInput);
    await incidentRepository.updateIncidentChannelId(
      incident.id,
      "C_INC_UPDATED",
    );

    const updated = await incidentRepository.findById(incident.id);
    expect(updated?.incidentChannelId).toBe("C_INC_UPDATED");
  });
});

describe("incidentRepository.updateSlackMessageTs", () => {
  afterEach(clearIncidents);

  it("updates the slackMessageTs field", async () => {
    const incident = await incidentRepository.create(baseInput);
    await incidentRepository.updateSlackMessageTs(
      incident.id,
      "1234567890.000001",
    );

    const updated = await incidentRepository.findById(incident.id);
    expect(updated?.slackMessageTs).toBe("1234567890.000001");
  });
});

describe("incidentRepository.resolve", () => {
  afterEach(clearIncidents);

  it("sets status to resolved and populates resolvedAt, resolvedBy, resolvedByName", async () => {
    const incident = await incidentRepository.create(baseInput);
    const resolvedAt = new Date();
    await incidentRepository.resolve(incident.id, resolvedAt, "U_ALICE", "alice");

    const resolved = await incidentRepository.findById(incident.id);
    expect(resolved?.status).toBe("resolved");
    expect(resolved?.resolvedAt).toBeInstanceOf(Date);
    expect(resolved?.resolvedBy).toBe("U_ALICE");
    expect(resolved?.resolvedByName).toBe("alice");
  });
});
