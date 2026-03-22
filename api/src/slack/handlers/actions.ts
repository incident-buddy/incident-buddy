import type { App } from "@slack/bolt";
import type { WebClient } from "@slack/web-api";
import { z } from "zod";
import { optionalEnv } from "../../env.js";
import type { Severity } from "../../features/incident/incident.model.js";
import { AlreadyResolvedError } from "../../features/incident/incident.model.js";
import {
  buildChannelWelcomeMessage,
  buildIncidentMessage,
  buildResolveConfirmModal,
  formatElapsedTime,
} from "../../features/incident/incident.presenter.js";
import { incidentService } from "../../features/incident/incident.service.js";
import {
  loadConfig,
  matchRules,
} from "../../features/incident-config/incident-config.service.js";
import {
  createIncidentChannel,
  inviteToChannel,
  resolveInvitees,
} from "./incident-channel.js";
import { postError } from "./post-error.js";

export async function refreshIncidentSlackMessage({
  incidentId,
  client,
}: {
  incidentId: string;
  client: WebClient;
}): Promise<void> {
  const incident = await incidentService.findById(incidentId);
  if (!incident) throw new Error(`Incident not found: ${incidentId}`);
  if (!incident.slackMessageTs) return;

  const message = buildIncidentMessage({
    incident,
    options: { incidentChannelId: incident.incidentChannelId },
  });
  const result = await client.chat.update({
    channel: incident.slackChannelId,
    ts: incident.slackMessageTs,
    ...message,
  });
  if (!result.ok) {
    throw new Error(result.error ?? "chat.update failed");
  }
}

export function registerActionHandlers(app: App): void {
  app.view("create_incident", async ({ ack, body, view, client }) => {
    await ack();

    const metaResult = z
      .object({ channel_id: z.string().optional() })
      .safeParse(JSON.parse(view.private_metadata ?? "{}"));
    const channelId = metaResult.success ? (metaResult.data.channel_id ?? "") : "";

    try {
      const values = view.state.values;
      const title = values.title?.title_input?.value ?? "";
      const severity: Severity =
        values.severity?.severity_select?.selected_option?.value ?? "Medium";
      const serviceName =
        values.service?.service_select?.selected_option?.value ?? "";
      const description = values.description?.description_input?.value ?? "";

      const userId = body.user.id;
      const userName = body.user.name;

      const incident = await incidentService.create({
        title,
        description,
        severity,
        serviceName,
        slackChannelId: channelId,
        createdBy: userId,
        createdByName: userName,
      });

      // インシデント対応チャンネルを作成
      const incidentChannel = await createIncidentChannel({
        client,
        date: new Date(),
      });

      const message = buildIncidentMessage({
        incident,
        options: { incidentChannelId: incidentChannel.id },
      });
      const result = await client.chat.postMessage({
        channel: channelId,
        ...message,
      });

      await incidentService.setChannelId(incident.id, incidentChannel.id);
      if (result.ts) {
        await incidentService.setSlackMessageTs(incident.id, result.ts);
      }

      // 設定ファイルを読み込む（ウェルカムメッセージのロールボタン・通知ルール共用）
      const configPath = optionalEnv("INCIDENT_CONFIG_PATH");
      const configResult = configPath ? await loadConfig(configPath) : null;
      const config = configResult?.type === "ok" ? configResult.config : null;

      // インシデントチャンネルにウェルカムメッセージを投稿
      const welcomeMessage = buildChannelWelcomeMessage(
        incident,
        config?.roles ?? [],
      );
      const welcomeResult = await client.chat.postMessage({
        channel: incidentChannel.id,
        ...welcomeMessage,
      });
      if (!welcomeResult.ok) {
        throw new Error(
          welcomeResult.error ?? "chat.postMessage failed for welcome message",
        );
      }
      if (welcomeResult.ts) {
        await incidentService.setWelcomeMessageTs(incident.id, welcomeResult.ts);
      }

      // 通知ルールの評価と追加通知・招待
      if (!config) return;

      const matched = matchRules({
        config,
        severity: incident.severity,
        serviceName: incident.serviceName,
      });

      // 全マッチルールからメンションを集めて招待対象を解決（重複排除）
      const allMentions = matched.flatMap((r) => r.actions.mentions);
      const invitees = await resolveInvitees({ client, mentions: allMentions });
      await inviteToChannel({
        client,
        channelId: incidentChannel.id,
        userIds: invitees,
      });

      for (const userId of invitees) {
        try {
          await client.chat.postMessage({
            channel: incidentChannel.id,
            text: `<@${userId}> を招待しました`,
          });
        } catch (e) {
          console.error(
            "[incident-buddy] Failed to post invite notification:",
            e,
          );
        }
      }
    } catch (e) {
      await postError({ client, channelId, error: e });
    }
  });

  const resolveMetaSchema = z.object({
    incidentId: z.string(),
    incidentChannelId: z.string(),
  });

  app.action("resolve_incident", async ({ ack, body, client }) => {
    await ack();

    if (body.type !== "block_actions") return;

    const channelId = body.channel?.id;
    if (!channelId) return;

    const userId = body.user.id;
    const triggerId = body.trigger_id;

    try {
      const incident = await incidentService.findByChannelId(channelId);
      if (!incident) return;

      if (incident.status === "resolved") {
        await client.chat.postEphemeral({
          channel: channelId,
          user: userId,
          text: "このインシデントはすでに解決済みです。",
        });
        return;
      }

      await client.views.open({
        trigger_id: triggerId,
        // coding-rules.md 例外: Slack SDK の View 型は blocks を KnownBlock[] と要求するが、
        // presenter が返す型の blocks は Block[] のため構造互換でも型が一致しない。
        // SDK 側の型定義の不正確さによる不一致であり、ランタイムでは問題ない。
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        view: buildResolveConfirmModal(incident) as any,
      });
    } catch (e) {
      await postError({ client, channelId, error: e });
    }
  });

  app.view("resolve_incident_modal", async ({ ack, body, view, client }) => {
    await ack();

    const metaResult = resolveMetaSchema.safeParse(
      JSON.parse(view.private_metadata ?? "{}"),
    );
    if (!metaResult.success) return;

    const { incidentId, incidentChannelId } = metaResult.data;
    const userId = body.user.id;
    const userName = body.user.name ?? body.user.id;
    const note =
      view.state.values["resolve_note_block"]?.["resolve_note"]?.value ??
      undefined;

    try {
      const incident = await incidentService.resolve(
        incidentId,
        userId,
        userName,
        note ?? undefined,
      );

      // ウェルカムメッセージを resolved 表示に更新（失敗時ログのみ）
      if (incident.welcomeMessageTs && incidentChannelId) {
        try {
          const updatedWelcome = buildChannelWelcomeMessage(incident, []);
          await client.chat.update({
            channel: incidentChannelId,
            ts: incident.welcomeMessageTs,
            ...updatedWelcome,
          });
        } catch (e) {
          console.error(
            "[incident-buddy] Failed to update welcome message on resolve:",
            e,
          );
        }
      }

      // #incidents メッセージを更新（失敗時ログのみ）
      try {
        await refreshIncidentSlackMessage({ incidentId, client });
      } catch (e) {
        console.error(
          "[incident-buddy] Failed to refresh incident slack message on resolve:",
          e,
        );
      }

      // インシデントチャンネルに解決通知を投稿（失敗時ログのみ）
      if (incidentChannelId) {
        const elapsed = incident.resolvedAt
          ? formatElapsedTime(incident.createdAt, incident.resolvedAt)
          : "";
        try {
          await client.chat.postMessage({
            channel: incidentChannelId,
            text: `✅ @${userName} がインシデントをクローズしました / 経過時間: ${elapsed}`,
          });
        } catch (e) {
          console.error(
            "[incident-buddy] Failed to post resolve notification:",
            e,
          );
        }
      }
    } catch (e) {
      if (e instanceof AlreadyResolvedError) {
        if (incidentChannelId) {
          await client.chat.postMessage({
            channel: incidentChannelId,
            text: e.message,
          });
        }
        return;
      }
      await postError({ client, channelId: incidentChannelId, error: e });
    }
  });

  app.action(/^assign_role_/, async ({ ack, body, action, client }) => {
    await ack();

    if (body.type !== "block_actions") return;

    const channelId = body.channel?.id;
    if (!channelId) return;

    const userId = body.user.id;
    const userName = body.user.name ?? body.user.id;

    // action_id から roleId を取り出す（assign_role_{roleId} 形式）
    const actionId =
      "action_id" in action ? (action.action_id as string) : "";
    const roleId = actionId.replace("assign_role_", "");

    try {
      const incident = await incidentService.findByChannelId(channelId);
      if (!incident) {
        console.error(
          `[incident-buddy] Incident not found for channel: ${channelId}`,
        );
        return;
      }

      // 重複アサインチェック
      const alreadyAssigned = incident.responders.some(
        (r) => r.roleId === roleId && r.userId === userId,
      );
      if (alreadyAssigned) {
        await client.chat.postEphemeral({
          channel: channelId,
          user: userId,
          text: "既にアサイン済みです。同じロールに重複してアサインすることはできません。",
        });
        return;
      }

      // アサイン処理
      const updatedIncident = await incidentService.addResponder(
        incident.id,
        roleId,
        userId,
        userName,
      );

      // ロール設定を取得してラベルを解決
      const configPath = optionalEnv("INCIDENT_CONFIG_PATH");
      const configResult = configPath ? await loadConfig(configPath) : null;
      const roles =
        configResult?.type === "ok" ? configResult.config.roles : [];
      const roleLabel =
        roles.find((r) => r.id === roleId)?.label ?? roleId;

      // ウェルカムメッセージを更新
      if (incident.welcomeMessageTs) {
        const updatedWelcome = buildChannelWelcomeMessage(
          updatedIncident,
          roles,
        );
        const updateResult = await client.chat.update({
          channel: channelId,
          ts: incident.welcomeMessageTs,
          ...updatedWelcome,
        });
        if (!updateResult.ok) {
          throw new Error(
            updateResult.error ?? "chat.update failed for welcome message",
          );
        }
      }

      // #incidents のインシデントメッセージを更新（失敗時はログのみ）
      try {
        await refreshIncidentSlackMessage({
          incidentId: incident.id,
          client,
        });
      } catch (e) {
        console.error(
          "[incident-buddy] Failed to refresh incident slack message:",
          e,
        );
      }

      // チャンネルにアサイン通知を投稿（失敗時はログのみ）
      try {
        await client.chat.postMessage({
          channel: channelId,
          text: `@${userName} が${roleLabel}になりました`,
        });
      } catch (e) {
        console.error(
          "[incident-buddy] Failed to post assignment notification:",
          e,
        );
      }
    } catch (e) {
      await postError({ client, channelId, error: e });
    }
  });
}
