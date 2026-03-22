import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../features/incident/incident.service.js", () => ({
  incidentService: {
    findById: vi.fn(),
    findByChannelId: vi.fn(),
    open: vi.fn(),
    addResponder: vi.fn(),
    resolve: vi.fn(),
  },
}));

const { incidentService } = await import(
  "../../features/incident/incident.service.js"
);
const {
  tryRefreshIncidentSlackMessage,
  tryPostInviteNotification,
  tryPostAssignmentNotification,
} = await import("./actions.js");

describe("tryPostInviteNotification", () => {
  afterEach(() => vi.clearAllMocks());

  it("招待通知を正しい内容で投稿する", async () => {
    const mockClient = {
      chat: { postMessage: vi.fn().mockResolvedValue({ ok: true }) },
    };

    await expect(
      tryPostInviteNotification(mockClient as never, "C_INC", "U123"),
    ).resolves.toBeUndefined();

    expect(mockClient.chat.postMessage).toHaveBeenCalledWith({
      channel: "C_INC",
      text: "<@U123> を招待しました",
    });
  });

  it("postMessage が失敗しても例外を伝播させず console.error を呼ぶ", async () => {
    const mockClient = {
      chat: { postMessage: vi.fn().mockRejectedValue(new Error("fail")) },
    };
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      tryPostInviteNotification(mockClient as never, "C_INC", "U123"),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      "[incident-buddy] Failed to post invite notification:",
      expect.any(Error),
    );
  });
});

describe("tryPostAssignmentNotification", () => {
  afterEach(() => vi.clearAllMocks());

  it("アサイン通知を正しい内容で投稿する", async () => {
    const mockClient = {
      chat: { postMessage: vi.fn().mockResolvedValue({ ok: true }) },
    };

    await expect(
      tryPostAssignmentNotification(mockClient as never, "C123", "alice", "Commander"),
    ).resolves.toBeUndefined();

    expect(mockClient.chat.postMessage).toHaveBeenCalledWith({
      channel: "C123",
      text: "@alice がCommanderになりました",
    });
  });

  it("postMessage が失敗しても例外を伝播させず console.error を呼ぶ", async () => {
    const mockClient = {
      chat: { postMessage: vi.fn().mockRejectedValue(new Error("fail")) },
    };
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      tryPostAssignmentNotification(mockClient as never, "C123", "alice", "Commander"),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      "[incident-buddy] Failed to post assignment notification:",
      expect.any(Error),
    );
  });
});

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
