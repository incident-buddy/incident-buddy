import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../db/firestore.js";
import * as telemetry from "../../telemetry.js";
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

describe("incidentRepository.findByChannelId", () => {
  afterEach(clearIncidents);

  it("channelId が一致するインシデントを返す", async () => {
    await incidentRepository.create("TEST_ID_BCI_001", {
      ...baseInput,
      slackChannelId: "C_ORIGINAL",
      incidentChannelId: "C_INC_001",
    }, new Date());

    const found = await incidentRepository.findByChannelId("C_INC_001");
    expect(found?.id).toBe("TEST_ID_BCI_001");
    expect(found?.createdAt).toBeInstanceOf(Date);
  });

  it("該当なしのとき null を返す", async () => {
    const result = await incidentRepository.findByChannelId("C_NONEXISTENT");
    expect(result).toBeNull();
  });
});

describe("incidentRepository.addTimelineEvent", () => {
  // timeline sub-collection は clearIncidents（親ドキュメント削除）では消えないため個別にクリアする
  async function clearTimeline(incidentId: string) {
    const snap = await db.collection("incidents").doc(incidentId).collection("timeline").get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
  }

  beforeEach(async () => {
    await clearTimeline("TEST_ID_TL_001");
    await clearIncidents();
  });

  afterEach(async () => {
    await clearTimeline("TEST_ID_TL_001");
    await clearIncidents();
  });

  it("タイムラインイベントを Firestore に保存する", async () => {
    const incident = await incidentRepository.create("TEST_ID_TL_001", baseInput, new Date());
    await incidentRepository.addTimelineEvent(incident.id, {
      type: "note",
      actorId: "U001",
      actorName: "alice",
      note: "調査開始",
      occurredAt: new Date(),
    });

    const snap = await db.collection("incidents").doc(incident.id).collection("timeline").get();
    expect(snap.size).toBe(1);
    expect(snap.docs[0]?.data().type).toBe("note");
    expect(snap.docs[0]?.data().actorId).toBe("U001");
    expect(snap.docs[0]?.data().note).toBe("調査開始");
  });
});

describe("incidentRepository - withSpan 計装", () => {
  afterEach(clearIncidents);

  it("create: 正しいスパン名と属性で withSpan が呼ばれる", async () => {
    const spy = vi.spyOn(telemetry, "withSpan").mockImplementation((_n, _a, fn) => fn());
    await incidentRepository.create("TEST_ID_SPY_001", baseInput, new Date());
    expect(spy).toHaveBeenCalledWith(
      "incident.repository.create",
      { collection: "incidents", operation: "create" },
      expect.any(Function),
    );
    spy.mockRestore();
  });

  it("findById: 正しいスパン名と属性で withSpan が呼ばれる", async () => {
    const spy = vi.spyOn(telemetry, "withSpan").mockImplementation((_n, _a, fn) => fn());
    await incidentRepository.findById("any-id");
    expect(spy).toHaveBeenCalledWith(
      "incident.repository.findById",
      { collection: "incidents", operation: "findById" },
      expect.any(Function),
    );
    spy.mockRestore();
  });

  it("findOpen: 正しいスパン名と属性で withSpan が呼ばれる", async () => {
    const spy = vi.spyOn(telemetry, "withSpan").mockImplementation((_n, _a, fn) => fn());
    await incidentRepository.findOpen();
    expect(spy).toHaveBeenCalledWith(
      "incident.repository.findOpen",
      { collection: "incidents", operation: "findOpen" },
      expect.any(Function),
    );
    spy.mockRestore();
  });

  it("update: 正しいスパン名と属性で withSpan が呼ばれる", async () => {
    const incident = await incidentRepository.create("TEST_ID_SPY_002", baseInput, new Date());
    const spy = vi.spyOn(telemetry, "withSpan").mockImplementation((_n, _a, fn) => fn());
    await incidentRepository.update(incident.id, { status: "resolved", resolvedAt: new Date(), resolvedBy: "U001", resolvedByName: "alice" });
    expect(spy).toHaveBeenCalledWith(
      "incident.repository.update",
      { collection: "incidents", operation: "update" },
      expect.any(Function),
    );
    spy.mockRestore();
  });

  it("addTimelineEvent: 正しいスパン名と属性で withSpan が呼ばれる", async () => {
    const incident = await incidentRepository.create("TEST_ID_SPY_003", baseInput, new Date());
    const spy = vi.spyOn(telemetry, "withSpan").mockImplementation((_n, _a, fn) => fn());
    await incidentRepository.addTimelineEvent(incident.id, { type: "note", actorId: "U001", actorName: "alice", note: "test", occurredAt: new Date() });
    expect(spy).toHaveBeenCalledWith(
      "incident.repository.addTimelineEvent",
      { collection: "timeline", operation: "addTimelineEvent" },
      expect.any(Function),
    );
    spy.mockRestore();
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
