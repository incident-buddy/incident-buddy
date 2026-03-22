import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../features/incident/incident.service.js", () => ({
  incidentService: {
    findById: vi.fn(),
    findByChannelId: vi.fn(),
    create: vi.fn(),
    setChannelId: vi.fn(),
    setSlackMessageTs: vi.fn(),
    setWelcomeMessageTs: vi.fn(),
    addResponder: vi.fn(),
    resolve: vi.fn(),
  },
}));

const { incidentService } = await import(
  "../../features/incident/incident.service.js"
);
const { tryRefreshIncidentSlackMessage } = await import("./actions.js");

describe("tryRefreshIncidentSlackMessage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("refreshIncidentSlackMessage が成功した場合は void で解決する", async () => {
    // slackMessageTs が空のインシデントを返すと refreshIncidentSlackMessage が早期リターンする
    vi.mocked(incidentService.findById).mockResolvedValue({
      id: "INC001",
      slackMessageTs: "",
    } as never);

    const mockClient = { chat: { update: vi.fn() } };

    await expect(
      tryRefreshIncidentSlackMessage({
        incidentId: "INC001",
        client: mockClient as never,
      }),
    ).resolves.toBeUndefined();

    // 早期リターンのため chat.update は呼ばれない
    expect(mockClient.chat.update).not.toHaveBeenCalled();
  });

  it("refreshIncidentSlackMessage が失敗しても例外を伝播させず console.error を呼ぶ", async () => {
    vi.mocked(incidentService.findById).mockRejectedValue(
      new Error("service fail"),
    );
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      tryRefreshIncidentSlackMessage({
        incidentId: "INC001",
        client: {} as never,
      }),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      "[incident-buddy] Failed to refresh incident slack message:",
      expect.any(Error),
    );
  });
});
