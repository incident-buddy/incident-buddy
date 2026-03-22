import { beforeEach, describe, expect, it, vi } from "vitest";
import { AlreadyResolvedError } from "./incident.model.js";
import type { Incident } from "./incident.model.js";
import type { IncidentSlackPort } from "./incident.slack-port.js";

vi.mock("./incident.repository.js", () => ({
  incidentRepository: {
    create: vi.fn(),
    update: vi.fn(),
    findById: vi.fn(),
    addTimelineEvent: vi.fn(),
  },
}));
vi.mock("../member/member.repository.js", () => ({
  memberRepository: {
    upsert: vi.fn(),
  },
}));

const { incidentService } = await import("./incident.service.js");
const { incidentRepository } = await import("./incident.repository.js");
const { memberRepository } = await import("../member/member.repository.js");

const mockIncident: Incident = {
  id: "INC001",
  title: "DB down",
  description: "Primary DB not responding",
  status: "open",
  severity: "P1",
  serviceName: "",
  slackChannelId: "C000TEST",
  slackMessageTs: "1111111111.000001",
  incidentChannelId: "C_INC_001",
  welcomeMessageTs: "2222222222.000001",
  createdBy: "U000TEST",
  createdByName: "testuser",
  teamIds: [],
  serviceIds: [],
  responders: [],
  createdAt: new Date("2026-03-21T00:00:00Z"),
  resolvedAt: null,
  resolvedBy: null,
  resolvedByName: null,
  updatedAt: new Date("2026-03-21T00:00:00Z"),
};

function makeStubAdapter(overrides: Partial<IncidentSlackPort> = {}): IncidentSlackPort {
  return {
    createChannel: vi.fn().mockResolvedValue({ id: "C_INC_001" }),
    postIncidentMessage: vi.fn().mockResolvedValue({ ts: "1111111111.000001" }),
    postWelcomeMessage: vi.fn().mockResolvedValue({ ts: "2222222222.000001" }),
    inviteAndNotify: vi.fn().mockResolvedValue(undefined),
    onResolved: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("incidentService.open", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(incidentRepository.create).mockResolvedValue(mockIncident);
    vi.mocked(memberRepository.upsert).mockResolvedValue(undefined);
  });

  it("upserts the member using createdBy and createdByName", async () => {
    await incidentService.open(
      {
        title: "DB down",
        description: "",
        severity: "P1",
        serviceName: "",
        slackChannelId: "C000TEST",
        createdBy: "U000TEST",
        createdByName: "testuser",
      },
      makeStubAdapter(),
    );

    expect(memberRepository.upsert).toHaveBeenCalledWith("U000TEST", "testuser");
  });

  it("creates channel, posts messages, then persists incident in one repository call", async () => {
    const adapter = makeStubAdapter();

    await incidentService.open(
      {
        title: "DB down",
        description: "Details",
        severity: "P1",
        serviceName: "",
        slackChannelId: "C000TEST",
        createdBy: "U000TEST",
        createdByName: "testuser",
      },
      adapter,
    );

    expect(adapter.createChannel).toHaveBeenCalledOnce();
    expect(adapter.postIncidentMessage).toHaveBeenCalledOnce();
    expect(adapter.postWelcomeMessage).toHaveBeenCalledOnce();

    expect(incidentRepository.create).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        title: "DB down",
        description: "Details",
        severity: "P1",
        slackChannelId: "C000TEST",
        createdBy: "U000TEST",
        createdByName: "testuser",
        incidentChannelId: "C_INC_001",
        slackMessageTs: "1111111111.000001",
        welcomeMessageTs: "2222222222.000001",
        teamIds: [],
        serviceIds: [],
        responders: [],
      }),
      expect.any(Date),
    );
  });

  it("returns the created incident from the repository", async () => {
    const result = await incidentService.open(
      {
        title: "DB down",
        description: "",
        severity: "P1",
        serviceName: "",
        slackChannelId: "C000TEST",
        createdBy: "U000TEST",
        createdByName: "testuser",
      },
      makeStubAdapter(),
    );

    expect(result).toBe(mockIncident);
  });
});

describe("incidentService.addResponder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(memberRepository.upsert).mockResolvedValue(undefined);
    vi.mocked(incidentRepository.update).mockResolvedValue(undefined);
    vi.mocked(incidentRepository.addTimelineEvent).mockResolvedValue(undefined);
    vi.mocked(incidentRepository.findById).mockResolvedValue(mockIncident);
  });

  it("upserts the member and appends a responder via update", async () => {
    await incidentService.addResponder("INC001", "commander", "U_BOB", "bob");

    expect(memberRepository.upsert).toHaveBeenCalledWith("U_BOB", "bob");
    expect(incidentRepository.update).toHaveBeenCalledWith("INC001", {
      responders: { add: { roleId: "commander", userId: "U_BOB", userName: "bob" } },
    });
  });

  it("records a responder_added timeline event", async () => {
    await incidentService.addResponder("INC001", "commander", "U_BOB", "bob");

    expect(incidentRepository.addTimelineEvent).toHaveBeenCalledWith(
      "INC001",
      expect.objectContaining({ type: "responder_added", actorId: "U_BOB", actorName: "bob" }),
    );
  });

  it("returns the latest incident fetched after update", async () => {
    const result = await incidentService.addResponder("INC001", "commander", "U_BOB", "bob");
    expect(result).toBe(mockIncident);
  });
});

describe("incidentService.resolve", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(incidentRepository.update).mockResolvedValue(undefined);
    vi.mocked(incidentRepository.addTimelineEvent).mockResolvedValue(undefined);
    vi.mocked(incidentRepository.findById).mockResolvedValue(mockIncident);
  });

  it("updates status and resolved fields via update", async () => {
    await incidentService.resolve("INC001", "U_ALICE", "alice", undefined, makeStubAdapter());

    expect(incidentRepository.update).toHaveBeenCalledWith(
      "INC001",
      expect.objectContaining({
        status: "resolved",
        resolvedBy: "U_ALICE",
        resolvedByName: "alice",
        resolvedAt: expect.any(Date),
      }),
    );
  });

  it("records a resolved timeline event with note", async () => {
    await incidentService.resolve("INC001", "U_ALICE", "alice", "fixed!", makeStubAdapter());

    expect(incidentRepository.addTimelineEvent).toHaveBeenCalledWith(
      "INC001",
      expect.objectContaining({ type: "resolved", actorId: "U_ALICE", note: "fixed!" }),
    );
  });

  it("throws AlreadyResolvedError when the incident is already resolved", async () => {
    vi.mocked(incidentRepository.findById).mockResolvedValue({ ...mockIncident, status: "resolved" });

    await expect(
      incidentService.resolve("INC001", "U_ALICE", "alice", undefined, makeStubAdapter()),
    ).rejects.toThrow(AlreadyResolvedError);
  });

  it("calls slack.onResolved with the incident fetched after update", async () => {
    const resolvedMockIncident: Incident = { ...mockIncident, status: "resolved" };
    vi.mocked(incidentRepository.findById)
      .mockResolvedValueOnce(mockIncident)          // 1回目: status チェック用
      .mockResolvedValueOnce(resolvedMockIncident); // 2回目: update 後の取得

    const adapter = makeStubAdapter();
    await incidentService.resolve("INC001", "U_ALICE", "alice", undefined, adapter);

    expect(adapter.onResolved).toHaveBeenCalledWith(resolvedMockIncident);
  });
});
