import type { App } from "@slack/bolt";
import type { WebClient } from "@slack/web-api";
import { z } from "zod";
import { optionalEnv } from "../../env.js";
import type { Incident } from "../../features/incident/incident.model.js";
import { AlreadyResolvedError } from "../../features/incident/incident.model.js";
import {
  buildChannelWelcomeMessage,
  buildIncidentMessage,
  buildResolveConfirmModal,
  formatElapsedTime,
} from "../../features/incident/incident.presenter.js";
import { incidentService } from "../../features/incident/incident.service.js";
import type { IncidentSlackPort } from "../../features/incident/incident.slack-port.js";
import { loadConfig } from "../../features/incident-config/incident-config.service.js";
import {
  createIncidentChannel,
  inviteToChannel,
  resolveInvitees,
  setChannelTopic,
} from "./incident-channel.js";
import { postError } from "./post-error.js";

/**
 * `IncidentSlackPort` の Slack SDK 実装（Adapter）を生成する
 *
 * @description Ports & Adapters パターンにおける Adapter ファクトリー。
 * `WebClient` を受け取り、`IncidentSlackPort` インターフェースを満たすオブジェクトを返す。
 * サービス層はこのオブジェクト経由で Slack I/O を行い、直接 SDK に依存しない。
 * @param client - Bolt ハンドラーから受け取る Slack WebClient
 * @returns `IncidentSlackPort` を実装したアダプターオブジェクト
 */
export function makeSlackAdapter(client: WebClient): IncidentSlackPort {
  const adapter: IncidentSlackPort = {
    createChannel: (date) => createIncidentChannel({ client, date }),

    postIncidentMessage: async (channelId, incident, incidentChannelId) => {
      const msg = buildIncidentMessage({
        incident,
        options: { incidentChannelId },
      });
      const r = await client.chat.postMessage({ channel: channelId, ...msg });
      if (!r.ok) throw new Error(r.error ?? "chat.postMessage failed");
      return { ts: r.ts ?? "" };
    },

    postWelcomeMessage: async (channelId, incident, roles) => {
      const msg = buildChannelWelcomeMessage(incident, roles);
      const r = await client.chat.postMessage({ channel: channelId, ...msg });
      if (!r.ok) throw new Error(r.error ?? "chat.postMessage failed");
      return { ts: r.ts ?? "" };
    },

    setTopic: async (channelId, incident) => {
      const r = await client.conversations.setTopic({
        channel: channelId,
        topic: `[${incident.status}] ${incident.serviceName} ${incident.title} ${incident.severity}`,
      });
      if (!r.ok) throw new Error(r.error ?? "conversations.setTopic failed");
    },

    refreshIncidentMessage: async (incident) => {
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
      if (!result.ok) throw new Error(result.error ?? "chat.update failed");
    },

    inviteAndNotify: async (channelId, mentions) => {
      const invitees = await resolveInvitees({ client, mentions });
      await inviteToChannel({ client, channelId, userIds: invitees });
      for (const userId of invitees) {
        await client.chat.postMessage({
          channel: channelId,
          text: `<@${userId}> を招待しました`,
        });
      }
    },

    onResolved: async (incident) => {
      const channelId = incident.incidentChannelId;
      if (!channelId) return;
      if (incident.welcomeMessageTs) {
        const updatedWelcome = buildChannelWelcomeMessage(incident, []);
        await client.chat.update({ channel: channelId, ts: incident.welcomeMessageTs, ...updatedWelcome });
      }
      await adapter.refreshIncidentMessage(incident);
      const elapsed = incident.resolvedAt
        ? formatElapsedTime(incident.createdAt, incident.resolvedAt)
        : "";
      await client.chat.postMessage({
        channel: channelId,
        text: `✅ @${incident.resolvedByName ?? ""} がインシデントをクローズしました / 経過時間: ${elapsed}`,
      });
      await setChannelTopic({ client, channelId, topic: `[Resolved] ${incident.title}` });
    },
  };
  return adapter;
}

/**
 * Slack インタラクションハンドラーを Bolt アプリに登録する
 *
 * @description 以下のハンドラーを登録する:
 * - `create_incident` ビュー送信: インシデント宣言フォームの処理
 * - `resolve_incident` アクション: 解決確認モーダルを開く
 * - `resolve_incident_modal` ビュー送信: インシデント解決処理
 * - `assign_role_*` アクション: ロールアサイン処理
 * @param app - Bolt `App` インスタンス
 */
export function registerActionHandlers(app: App): void {
  app.view("create_incident", async ({ ack, body, view, client }) => {
    await ack();

    const metaResult = z
      .object({ channel_id: z.string().optional() })
      .safeParse(JSON.parse(view.private_metadata ?? "{}"));
    const channelId = metaResult.success
      ? (metaResult.data.channel_id ?? "")
      : "";

    try {
      const values = view.state.values;
      const title = values.title?.title_input?.value ?? "";
      const severity =
        values.severity?.severity_select?.selected_option?.value ?? "Medium";
      const serviceName =
        values.service?.service_select?.selected_option?.value ?? "";
      const description = values.description?.description_input?.value ?? "";

      const userId = body.user.id;
      const userName = body.user.name;

      const incident = await incidentService.open(
        {
          title,
          description,
          severity,
          serviceName,
          slackChannelId: channelId,
          createdBy: userId,
          createdByName: userName,
        },
        makeSlackAdapter(client),
      );

      if (incident.incidentChannelId) {
        await setChannelTopic({
          client,
          channelId: incident.incidentChannelId,
          topic: `[${incident.severity}] ${incident.title} - 対応中`,
        });
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
      await incidentService.resolve(
        incidentId,
        userId,
        userName,
        note ?? undefined,
        makeSlackAdapter(client),
      );
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
      "action_id" in action && typeof action.action_id === "string"
        ? action.action_id
        : "";
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
      const roleLabel = roles.find((r) => r.id === roleId)?.label ?? roleId;

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

      // #incidents のインシデントメッセージを更新
      await makeSlackAdapter(client).refreshIncidentMessage(updatedIncident);

      // チャンネルにアサイン通知を投稿
      await client.chat.postMessage({
        channel: channelId,
        text: `@${userName} が${roleLabel}になりました`,
      });
    } catch (e) {
      await postError({ client, channelId, error: e });
    }
  });
}

