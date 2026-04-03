import { ulid } from "ulid";
import { optionalEnv } from "../../env.js";
import {
  loadConfig,
  matchRules,
} from "../incident-config/incident-config.service.js";
import { memberRepository } from "../member/member.repository.js";
import type { CreateIncidentParams, Incident } from "./incident.model.js";
import { AlreadyResolvedError } from "./incident.model.js";
import { incidentRepository } from "./incident.repository.js";
import type { IncidentSlackPort } from "./incident.slack-port.js";

export const incidentService = {
  /**
   * インシデントを宣言し、Slack チャンネルの作成・メッセージ投稿を一括で行う
   *
   * @description 以下の順序でインシデント開設処理を実行する:
   * 1. 宣言者をメンバーとして upsert
   * 2. ULID でインシデント ID を発番
   * 3. 設定ファイルを読み込む（ロールボタン・通知ルール共用）
   * 4. Slack チャンネルを作成（`slack.createChannel`）
   * 5. インシデントメッセージ・ウェルカムメッセージを並列投稿
   * 6. 全フィールドを揃えて Firestore に 1 回の write で保存
   * 7. 通知ルールにマッチするユーザーをチャンネルに招待・通知
   * @param params - インシデント作成に必要なパラメーター
   * @param slack - Slack I/O を委譲する Port アダプター
   * @returns 作成されたインシデントのドメインオブジェクト
   * @throws チャンネル作成・メッセージ投稿・DB 書き込みのいずれかが失敗した場合
   */
  async open(params: CreateIncidentParams, slack: IncidentSlackPort): Promise<Incident> {
    await memberRepository.upsert(params.createdBy, params.createdByName);

    const id = ulid();

    const configPath = optionalEnv("INCIDENT_CONFIG_PATH");
    const configResult = configPath ? await loadConfig(configPath) : null;
    const config = configResult?.type === "ok" ? configResult.config : null;

    const channel = await slack.createChannel(new Date());

    const draft: Incident = {
      id,
      ...params,
      status: "open",
      incidentChannelId: channel.id,
      slackMessageTs: "",
      welcomeMessageTs: undefined,
      responders: [],
      teamIds: [],
      serviceIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null,
      resolvedBy: null,
      resolvedByName: null,
    };

    const [msgResult, welcomeResult] = await Promise.all([
      slack.postIncidentMessage(params.slackChannelId, draft, channel.id),
      slack.postWelcomeMessage(channel.id, draft, config?.roles ?? []),
    ]);

    const incident = await incidentRepository.create(id, {
      ...params,
      incidentChannelId: channel.id,
      slackMessageTs: msgResult.ts,
      welcomeMessageTs: welcomeResult.ts,
      teamIds: [],
      serviceIds: [],
      responders: [],
    }, new Date());

    if (config) {
      const matched = matchRules({
        config,
        severity: params.severity,
        serviceName: params.serviceName,
      });
      const allMentions = matched.flatMap((r) => r.actions.mentions);
      if (allMentions.length > 0) {
        await slack.inviteAndNotify(channel.id, allMentions);
      }
    }

    return incident;
  },

  /**
   * インシデント ID でインシデントを取得する
   *
   * @param id - 検索するインシデントの ID
   * @returns 見つかった場合はドメインオブジェクト、存在しない場合は `null`
   */
  async findById(id: string): Promise<Incident | null> {
    return incidentRepository.findById(id);
  },

  /**
   * ステータスが `"open"` のインシデントを作成日時の降順で取得する（最大10件）
   *
   * @returns オープン中のインシデント一覧（新しい順）
   */
  async findOpen(): Promise<Incident[]> {
    return incidentRepository.findOpen();
  },

  /**
   * インシデント対応チャンネル ID でインシデントを取得する
   *
   * @param channelId - 検索するインシデント対応チャンネルの Slack チャンネル ID
   * @returns 見つかった場合はドメインオブジェクト、存在しない場合は `null`
   */
  async findByChannelId(channelId: string): Promise<Incident | null> {
    return incidentRepository.findByChannelId(channelId);
  },

  /**
   * インシデントにレスポンダーを追加し、タイムラインに記録する
   *
   * @param incidentId - 対象インシデントの ID
   * @param roleId - アサインするロールの ID
   * @param userId - アサインするユーザーの Slack ユーザー ID
   * @param userName - アサインするユーザーの表示名
   * @returns レスポンダー追加後の最新インシデント
   * @throws インシデントが存在しない場合
   */
  async addResponder(
    incidentId: string,
    roleId: string,
    userId: string,
    userName: string,
  ): Promise<Incident> {
    await memberRepository.upsert(userId, userName);
    await incidentRepository.update(incidentId, {
      responders: { add: { roleId, userId, userName } },
    });
    await incidentRepository.addTimelineEvent(incidentId, {
      type: "responder_added",
      actorId: userId,
      actorName: userName,
      note: `${userName} が ${roleId} になりました`,
      occurredAt: new Date(),
    });
    const updated = await incidentRepository.findById(incidentId);
    if (!updated) throw new Error(`Incident not found: ${incidentId}`);
    return updated;
  },

  /**
   * インシデントを解決済みに更新し、Slack への後処理を委譲する
   *
   * @description DB の状態を resolved に更新・タイムラインへの記録を行った後、
   * `slack.onResolved` に Slack 側の後処理（ウェルカムメッセージ更新・解決通知投稿など）を委譲する。
   * @param incidentId - 解決するインシデントの ID
   * @param userId - 解決操作を行ったユーザーの Slack ユーザー ID
   * @param userName - 解決操作を行ったユーザーの表示名
   * @param note - 解決時のメモ（省略可）
   * @param slack - Slack I/O を委譲する Port アダプター
   * @returns 解決後の最新インシデント
   * @throws `AlreadyResolvedError` - インシデントがすでに解決済みの場合
   * @throws インシデントが存在しない場合、または DB 更新が失敗した場合
   */
  async resolve(
    incidentId: string,
    userId: string,
    userName: string,
    note: string | undefined,
    slack: IncidentSlackPort,
  ): Promise<Incident> {
    const incident = await incidentRepository.findById(incidentId);
    if (!incident) throw new Error(`Incident not found: ${incidentId}`);
    if (incident.status === "resolved") throw new AlreadyResolvedError();

    const resolvedAt = new Date();
    await incidentRepository.update(incidentId, {
      status: "resolved",
      resolvedAt,
      resolvedBy: userId,
      resolvedByName: userName,
    });
    await incidentRepository.addTimelineEvent(incidentId, {
      type: "resolved",
      actorId: userId,
      actorName: userName,
      note: note ?? "",
      occurredAt: resolvedAt,
    });

    const updated = await incidentRepository.findById(incidentId);
    if (!updated) throw new Error(`Incident not found after resolve: ${incidentId}`);

    await slack.onResolved(updated);
    return updated;
  },
};
