import { describe, expect, it, vi } from "vitest";
import * as telemetry from "../../telemetry.js";
import {
  buildChannelName,
  createIncidentChannel,
  inviteToChannel,
  resolveInvitees,
  setChannelTopic,
} from "./incident-channel.js";

function makeClient(overrides: Partial<{
  createResult: { ok: boolean; channel?: { id?: string; name?: string }; error?: string };
  createImpl: (args: { name: string }) => Promise<{ ok: boolean; channel?: { id?: string; name?: string }; error?: string }>;
  inviteResult: { ok: boolean; error?: string };
  usergroupsUsers: string[];
  setTopicResult: { ok: boolean; error?: string };
}> = {}) {
  return {
    conversations: {
      create: overrides.createImpl ?? vi.fn().mockResolvedValue(
        overrides.createResult ?? { ok: true, channel: { id: "C_NEW", name: "inc-20260101-001" } }
      ),
      invite: vi.fn().mockResolvedValue(
        overrides.inviteResult ?? { ok: true }
      ),
      setTopic: vi.fn().mockResolvedValue(
        overrides.setTopicResult ?? { ok: true }
      ),
    },
    usergroups: {
      users: {
        list: vi.fn().mockResolvedValue({ ok: true, users: overrides.usergroupsUsers ?? [] }),
      },
    },
  };
}

describe("buildChannelName", () => {
  it("inc-YYYYMMDD-NNN 形式の文字列を生成する", () => {
    expect(buildChannelName({ date: new Date("2026-03-21T00:00:00Z"), seq: 1 })).toBe(
      "inc-20260321-001",
    );
  });

  it("連番は3桁ゼロ埋めになる", () => {
    expect(buildChannelName({ date: new Date("2026-03-21T00:00:00Z"), seq: 9 })).toBe(
      "inc-20260321-009",
    );
    expect(buildChannelName({ date: new Date("2026-03-21T00:00:00Z"), seq: 99 })).toBe(
      "inc-20260321-099",
    );
  });

  it("連番が100以上のときはゼロ埋めなし", () => {
    expect(buildChannelName({ date: new Date("2026-03-21T00:00:00Z"), seq: 100 })).toBe(
      "inc-20260321-100",
    );
  });

  it("月・日が1桁のときはゼロ埋めになる", () => {
    expect(buildChannelName({ date: new Date("2026-01-05T00:00:00Z"), seq: 1 })).toBe(
      "inc-20260105-001",
    );
  });
});

describe("createIncidentChannel", () => {
  it("チャンネルを作成して id と name を返す", async () => {
    const client = makeClient();
    const result = await createIncidentChannel({ client, date: new Date("2026-01-01T00:00:00Z") });
    expect(result.id).toBe("C_NEW");
    expect(result.name).toBe("inc-20260101-001");
  });

  it("name_taken の場合、連番を増やしてリトライする", async () => {
    let callCount = 0;
    const client = makeClient({
      createImpl: vi.fn().mockImplementation(async ({ name }: { name: string }) => {
        callCount++;
        if (callCount < 3) throw new Error("name_taken");
        return { ok: true, channel: { id: "C_RETRY", name } };
      }),
    });

    const result = await createIncidentChannel({ client, date: new Date("2026-01-01T00:00:00Z") });

    expect(client.conversations.create).toHaveBeenCalledTimes(3);
    expect(result.id).toBe("C_RETRY");
  });

  it("MAX_RETRIES 超過後に例外をスローする", async () => {
    const client = makeClient({
      createImpl: vi.fn().mockRejectedValue(new Error("name_taken")),
    });

    await expect(
      createIncidentChannel({ client, date: new Date("2026-01-01T00:00:00Z") })
    ).rejects.toThrow("Failed to create channel after 10 retries");
  });

  it("withSpan に正しいスパン名と属性が渡される", async () => {
    const spy = vi.spyOn(telemetry, "withSpan").mockImplementation((_n, _a, fn) => fn());
    const client = makeClient();
    await createIncidentChannel({ client, date: new Date("2026-01-01T00:00:00Z") });
    expect(spy).toHaveBeenCalledWith(
      "slack.conversations.create",
      { api: "conversations.create" },
      expect.any(Function),
    );
    spy.mockRestore();
  });
});

describe("resolveInvitees", () => {
  it("@here と @channel を無視する", async () => {
    const client = makeClient();
    const result = await resolveInvitees({ client, mentions: ["@here", "@channel"] });
    expect(result).toHaveLength(0);
  });

  it("@U... をユーザーID として直接使用する", async () => {
    const client = makeClient();
    const result = await resolveInvitees({ client, mentions: ["@U001", "@U002"] });
    expect(result).toContain("U001");
    expect(result).toContain("U002");
  });

  it("@S... グループID のメンバーを usergroups.users.list で解決する", async () => {
    const client = makeClient({ usergroupsUsers: ["U100", "U101"] });
    const result = await resolveInvitees({ client, mentions: ["@S_GROUP"] });
    expect(result).toContain("U100");
    expect(result).toContain("U101");
    expect(client.usergroups.users.list).toHaveBeenCalledWith({ usergroup: "S_GROUP" });
  });

  it("グループ解決失敗時は例外を伝播させず空配列になる", async () => {
    const client = makeClient();
    client.usergroups.users.list = vi.fn().mockRejectedValue(new Error("group not found"));
    const result = await resolveInvitees({ client, mentions: ["@S_BROKEN"] });
    expect(result).toHaveLength(0);
  });
});

describe("setChannelTopic", () => {
  it("conversations.setTopic に channel と topic を正しく渡す", async () => {
    const client = makeClient();
    await setChannelTopic({ client, channelId: "C_INC", topic: "[Critical] DB is down - 対応中" });
    expect(client.conversations.setTopic).toHaveBeenCalledWith({
      channel: "C_INC",
      topic: "[Critical] DB is down - 対応中",
    });
  });

  it("ok: true のとき undefined を返し例外を伝播させない", async () => {
    const client = makeClient({ setTopicResult: { ok: true } });
    await expect(
      setChannelTopic({ client, channelId: "C_INC", topic: "[Critical] DB is down - 対応中" })
    ).resolves.toBeUndefined();
  });

  it("ok: false のとき例外を伝播させない", async () => {
    const client = makeClient({ setTopicResult: { ok: false, error: "missing_scope" } });
    await expect(
      setChannelTopic({ client, channelId: "C_INC", topic: "some topic" })
    ).resolves.toBeUndefined();
  });

  it("setTopic が throw しても例外を伝播させない", async () => {
    const client = makeClient();
    client.conversations.setTopic = vi.fn().mockRejectedValue(new Error("network error"));
    await expect(
      setChannelTopic({ client, channelId: "C_INC", topic: "some topic" })
    ).resolves.toBeUndefined();
  });
});

describe("inviteToChannel", () => {
  it("userIds が空のとき Slack API を呼ばない", async () => {
    const client = makeClient();
    await inviteToChannel({ client, channelId: "C_INC", userIds: [] });
    expect(client.conversations.invite).not.toHaveBeenCalled();
  });

  it("userIds をカンマ区切りで conversations.invite に渡す", async () => {
    const client = makeClient();
    await inviteToChannel({ client, channelId: "C_INC", userIds: ["U001", "U002"] });
    expect(client.conversations.invite).toHaveBeenCalledWith({
      channel: "C_INC",
      users: "U001,U002",
    });
  });

  it("ok: false のとき例外を伝播させない", async () => {
    const client = makeClient({ inviteResult: { ok: false, error: "cant_invite_self" } });
    await expect(
      inviteToChannel({ client, channelId: "C_INC", userIds: ["U001"] })
    ).resolves.toBeUndefined();
  });

  it("withSpan に正しいスパン名と属性が渡される", async () => {
    const spy = vi.spyOn(telemetry, "withSpan").mockImplementation((_n, _a, fn) => fn());
    const client = makeClient();
    await inviteToChannel({ client, channelId: "C_INC", userIds: ["U001"] });
    expect(spy).toHaveBeenCalledWith(
      "slack.conversations.invite",
      { api: "conversations.invite" },
      expect.any(Function),
    );
    spy.mockRestore();
  });
});
