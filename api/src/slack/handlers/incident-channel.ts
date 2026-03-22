type SlackClient = {
  conversations: {
    create: (args: { name: string; is_private?: boolean }) => Promise<{
      ok: boolean;
      channel?: { id?: string; name?: string };
      error?: string;
    }>;
    invite: (args: {
      channel: string;
      users: string;
    }) => Promise<{ ok: boolean; error?: string }>;
  };
  usergroups: {
    users: {
      list: (args: {
        usergroup: string;
      }) => Promise<{ ok: boolean; users?: string[]; error?: string }>;
    };
  };
};

/**
 * inc-YYYYMMDD-NNN 形式のチャンネル名を生成する（純粋関数）
 */
export function buildChannelName({
  date,
  seq,
}: {
  date: Date;
  seq: number;
}): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const n = String(seq).padStart(3, "0");
  return `inc-${y}${m}${d}-${n}`;
}

/**
 * パブリックチャンネルを作成する。name_taken の場合は連番を増やしてリトライする。
 * Slack WebClient は ok: false を WebAPICallError として throw するため try-catch で処理する。
 */
export async function createIncidentChannel({
  client,
  date,
}: {
  client: SlackClient;
  date: Date;
}): Promise<{ id: string; name: string }> {
  const MAX_RETRIES = 10;
  for (let seq = 1; seq <= MAX_RETRIES; seq++) {
    const name = buildChannelName({ date, seq });
    try {
      const result = await client.conversations.create({
        name,
        is_private: false,
      });
      if (!result.ok) {
        throw new Error(result.error ?? "conversations.create failed");
      }
      const id = result.channel?.id;
      const channelName = result.channel?.name;
      if (id && channelName) {
        return { id, name: channelName };
      }
      throw new Error(`Failed to create channel: missing id/name in response`);
    } catch (e) {
      if (e instanceof Error && e.message.includes("name_taken")) {
        continue;
      }
      throw e;
    }
  }
  throw new Error(`Failed to create channel after ${MAX_RETRIES} retries`);
}

/**
 * mentions 配列からチャンネルへ招待するユーザーIDリストを解決する。
 * - @here, @channel → 無視
 * - @U... / @W... → ユーザーID として直接使用
 * - @S... → グループID として usergroups.users.list でメンバー取得
 */
export async function resolveInvitees({
  client,
  mentions,
}: {
  client: SlackClient;
  mentions: string[];
}): Promise<string[]> {
  const userIds = new Set<string>();

  for (const mention of mentions) {
    const raw = mention.startsWith("@") ? mention.slice(1) : mention;

    if (raw === "here" || raw === "channel") {
      continue;
    }

    if (raw.startsWith("U") || raw.startsWith("W")) {
      userIds.add(raw);
      continue;
    }

    if (raw.startsWith("S")) {
      try {
        const result = await client.usergroups.users.list({ usergroup: raw });
        if (result.ok && result.users) {
          for (const uid of result.users) {
            userIds.add(uid);
          }
        } else if (!result.ok) {
          console.error(
            `[incident-buddy] Failed to resolve group ${raw}:`,
            result.error,
          );
        }
      } catch (e) {
        console.error(`[incident-buddy] Failed to resolve group ${raw}:`, e);
      }
    }
  }

  return Array.from(userIds);
}

/**
 * チャンネルにユーザーを招待する。
 * 招待失敗はコンソールにログのみ出力し、例外を伝播させない（処理を継続する）。
 */
export async function inviteToChannel({
  client,
  channelId,
  userIds,
}: {
  client: SlackClient;
  channelId: string;
  userIds: string[];
}): Promise<void> {
  if (userIds.length === 0) return;

  try {
    const result = await client.conversations.invite({
      channel: channelId,
      users: userIds.join(","),
    });
    if (!result.ok) {
      console.error(
        "[incident-buddy] Failed to invite users to incident channel:",
        result.error,
      );
    }
  } catch (e) {
    console.error(
      "[incident-buddy] Failed to invite users to incident channel:",
      e,
    );
  }
}
