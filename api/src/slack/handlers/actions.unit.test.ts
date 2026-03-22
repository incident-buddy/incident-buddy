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
const {
  tryRefreshIncidentSlackMessage,
  tryUpdateWelcomeMessage,
  tryPostResolveNotification,
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

describe("tryUpdateWelcomeMessage", () => {
  afterEach(() => vi.clearAllMocks());

  it("chat.update が成功した場合は void で解決する", async () => {
    const mockClient = { chat: { update: vi.fn().mockResolvedValue({ ok: true }) } };
    const incident = {
      id: "INC001",
      title: "DB down",
      status: "open",
      severity: "P1",
      serviceName: "",
      slackChannelId: "C000",
      slackMessageTs: "",
      createdBy: "U000",
      createdByName: "testuser",
      teamIds: [],
      serviceIds: [],
      responders: [],
      createdAt: new Date(),
      resolvedAt: null,
      resolvedBy: null,
      resolvedByName: null,
      updatedAt: new Date(),
    } as never;

    await expect(
      tryUpdateWelcomeMessage(mockClient as never, "C_INC", "1234.0", incident),
    ).resolves.toBeUndefined();

    expect(mockClient.chat.update).toHaveBeenCalledWith(
      expect.objectContaining({ channel: "C_INC", ts: "1234.0" }),
    );
  });

  it("chat.update が失敗しても例外を伝播させず console.error を呼ぶ", async () => {
    const mockClient = {
      chat: { update: vi.fn().mockRejectedValue(new Error("update fail")) },
    };
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      tryUpdateWelcomeMessage(mockClient as never, "C_INC", "1234.0", {} as never),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      "[incident-buddy] Failed to update welcome message on resolve:",
      expect.any(Error),
    );
  });
});

describe("tryPostResolveNotification", () => {
  afterEach(() => vi.clearAllMocks());

  it("解決通知を正しい内容で投稿する", async () => {
    const mockClient = {
      chat: { postMessage: vi.fn().mockResolvedValue({ ok: true }) },
    };

    await expect(
      tryPostResolveNotification(mockClient as never, "C_INC", "alice", "1h 30m"),
    ).resolves.toBeUndefined();

    expect(mockClient.chat.postMessage).toHaveBeenCalledWith({
      channel: "C_INC",
      text: "✅ @alice がインシデントをクローズしました / 経過時間: 1h 30m",
    });
  });

  it("postMessage が失敗しても例外を伝播させず console.error を呼ぶ", async () => {
    const mockClient = {
      chat: { postMessage: vi.fn().mockRejectedValue(new Error("post fail")) },
    };
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      tryPostResolveNotification(mockClient as never, "C_INC", "alice", ""),
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      "[incident-buddy] Failed to post resolve notification:",
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
