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

  it("stores the incident with the provided id and status=open", async () => {
    const incident = await incidentRepository.create("TEST_ID_001", baseInput, new Date());

    expect(incident.id).toBe("TEST_ID_001");
    expect(incident.status).toBe("open");
    expect(incident.title).toBe("DB is down");
    expect(incident.severity).toBe("P1");
  });

  it("returns Date instances for timestamp fields", async () => {
    const incident = await incidentRepository.create("TEST_ID_002", baseInput, new Date());

    expect(incident.createdAt).toBeInstanceOf(Date);
    expect(incident.updatedAt).toBeInstanceOf(Date);
    expect(incident.resolvedAt).toBeNull();
  });
});

describe("incidentRepository.findById", () => {
  afterEach(clearIncidents);

  it("returns the incident when it exists", async () => {
    const created = await incidentRepository.create("TEST_ID_003", baseInput, new Date());
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
    await incidentRepository.create("TEST_ID_004", { ...baseInput, title: "First" }, new Date());
    await incidentRepository.create("TEST_ID_005", { ...baseInput, title: "Second" }, new Date());

    const incidents = await incidentRepository.findOpen();

    expect(incidents).toHaveLength(2);
    expect(incidents[0]?.createdAt.getTime()).toBeGreaterThanOrEqual(
      incidents[1]?.createdAt.getTime() ?? 0,
    );
  });

  it("excludes resolved incidents", async () => {
    const open = await incidentRepository.create("TEST_ID_006", {
      ...baseInput,
      title: "Open",
    }, new Date());
    const toResolve = await incidentRepository.create("TEST_ID_007", {
      ...baseInput,
      title: "Resolved",
    }, new Date());
    await incidentRepository.update(toResolve.id, {
      status: "resolved",
      resolvedAt: new Date(),
      resolvedBy: "U_TEST",
      resolvedByName: "testuser",
    });

    const incidents = await incidentRepository.findOpen();

    expect(incidents).toHaveLength(1);
    expect(incidents[0]?.id).toBe(open.id);
  });
});

describe("incidentRepository.update", () => {
  afterEach(clearIncidents);

  it("updates scalar fields: status, resolvedAt, resolvedBy, resolvedByName", async () => {
    const incident = await incidentRepository.create("TEST_ID_008", baseInput, new Date());
    const resolvedAt = new Date();
    await incidentRepository.update(incident.id, {
      status: "resolved",
      resolvedAt,
      resolvedBy: "U_ALICE",
      resolvedByName: "alice",
    });

    const updated = await incidentRepository.findById(incident.id);
    expect(updated?.status).toBe("resolved");
    expect(updated?.resolvedAt).toBeInstanceOf(Date);
    expect(updated?.resolvedBy).toBe("U_ALICE");
    expect(updated?.resolvedByName).toBe("alice");
  });

  it("appends a responder via responders.add", async () => {
    const incident = await incidentRepository.create("TEST_ID_009", baseInput, new Date());
    await incidentRepository.update(incident.id, {
      responders: { add: { roleId: "commander", userId: "U_BOB", userName: "bob" } },
    });

    const updated = await incidentRepository.findById(incident.id);
    expect(updated?.responders).toHaveLength(1);
    expect(updated?.responders[0]?.userId).toBe("U_BOB");
  });

  it("removes a responder via responders.remove", async () => {
    const incident = await incidentRepository.create("TEST_ID_010", baseInput, new Date());
    const responder = { roleId: "commander", userId: "U_BOB", userName: "bob" };
    await incidentRepository.update(incident.id, { responders: { add: responder } });
    await incidentRepository.update(incident.id, { responders: { remove: responder } });

    const updated = await incidentRepository.findById(incident.id);
    expect(updated?.responders).toHaveLength(0);
  });
});
