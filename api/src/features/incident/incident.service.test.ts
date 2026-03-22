import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Incident } from "./incident.model.js";

vi.mock("./incident.repository.js", () => ({
  incidentRepository: {
    create: vi.fn(),
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
  slackMessageTs: "",
  incidentChannelId: "C_INC_001",
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

describe("incidentService.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(incidentRepository.create).mockResolvedValue(mockIncident);
    vi.mocked(memberRepository.upsert).mockResolvedValue(undefined);
  });

  it("upserts the member using createdBy and createdByName", async () => {
    await incidentService.create({
      title: "DB down",
      description: "",
      severity: "P1",
      serviceName: "",
      slackChannelId: "C000TEST",
      createdBy: "U000TEST",
      createdByName: "testuser",
    });

    expect(memberRepository.upsert).toHaveBeenCalledWith(
      "U000TEST",
      "testuser",
    );
  });

  it("creates the incident with empty slackMessageTs and empty relation arrays", async () => {
    await incidentService.create({
      title: "DB down",
      description: "Details",
      severity: "P1",
      serviceName: "",
      slackChannelId: "C000TEST",
      createdBy: "U000TEST",
      createdByName: "testuser",
    });

    expect(incidentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "DB down",
        description: "Details",
        severity: "P1",
        slackChannelId: "C000TEST",
        createdBy: "U000TEST",
        createdByName: "testuser",
        slackMessageTs: "",
        teamIds: [],
        serviceIds: [],
        responders: [],
      }),
      expect.any(Date),
    );
  });

  it("returns the created incident from the repository", async () => {
    const result = await incidentService.create({
      title: "DB down",
      description: "",
      severity: "P1",
      serviceName: "",
      slackChannelId: "C000TEST",
      createdBy: "U000TEST",
      createdByName: "testuser",
    });

    expect(result).toBe(mockIncident);
  });
});
