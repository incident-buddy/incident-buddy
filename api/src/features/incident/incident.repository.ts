import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { incidentsCol, timelineCol } from "../../db/firestore.js";
import type { AddTimelineEventInput, CreateIncidentInput, IncidentDoc, TimelineEventDoc } from "../../db/types.js";
import type { Incident, Responder } from "./incident.model.js";

/**
 * Firestore ドキュメント形式のインシデントをドメインモデルに変換する
 *
 * @param doc - Firestore から取得した `IncidentDoc`（`Timestamp` 型を含む）
 * @returns `Timestamp` を `Date` に変換した `Incident` ドメインオブジェクト
 */
function toDomain(doc: IncidentDoc): Incident {
  return {
    ...doc,
    createdAt: doc.createdAt.toDate(),
    updatedAt: doc.updatedAt.toDate(),
    resolvedAt: doc.resolvedAt?.toDate() ?? null,
    resolvedBy: doc.resolvedBy ?? null,
    resolvedByName: doc.resolvedByName ?? null,
  };
}

export const incidentRepository = {
  /**
   * インシデントを Firestore に新規作成する
   *
   * @description 呼び出し元が発番した `id` を使って Firestore ドキュメントを作成する。
   * `status` は `"open"` 固定、解決関連フィールドはすべて `null` で初期化される。
   * @param id - 事前に発番済みのドキュメント ID（ULID 推奨）
   * @param input - インシデントの初期データ（チャンネル ID・メッセージ ts を含む）
   * @param createdAt - 作成日時
   * @returns 作成されたインシデントのドメインオブジェクト
   */
  async create(id: string, input: CreateIncidentInput, createdAt: Date): Promise<Incident> {
    const ref = incidentsCol.doc(id);
    const ts = Timestamp.fromDate(createdAt);
    const doc: IncidentDoc = {
      ...input,
      id: ref.id,
      status: "open",
      createdAt: ts,
      updatedAt: ts,
      resolvedAt: null,
      resolvedBy: null,
      resolvedByName: null,
    };
    await ref.set(doc);
    return toDomain(doc);
  },

  /**
   * ドキュメント ID でインシデントを取得する
   *
   * @param id - 検索するインシデントの ID
   * @returns 見つかった場合はドメインオブジェクト、存在しない場合は `null`
   */
  async findById(id: string): Promise<Incident | null> {
    const snap = await incidentsCol.doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data();
    return data ? toDomain(data) : null;
  },

  /**
   * インシデント対応チャンネル ID でインシデントを取得する
   *
   * @param channelId - 検索するインシデント対応チャンネルの Slack チャンネル ID
   * @returns 見つかった場合はドメインオブジェクト、存在しない場合は `null`
   */
  async findByChannelId(channelId: string): Promise<Incident | null> {
    const snap = await incidentsCol
      .where("incidentChannelId", "==", channelId)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const data = snap.docs[0]?.data();
    return data ? toDomain(data) : null;
  },

  /**
   * ステータスが `"open"` のインシデントを作成日時の降順で取得する
   *
   * @returns オープン中のインシデント一覧（新しい順）
   */
  async findOpen(): Promise<Incident[]> {
    const snap = await incidentsCol
      .where("status", "==", "open")
      .orderBy("createdAt", "desc")
      .get();
    return snap.docs.map((d) => toDomain(d.data()));
  },

  /**
   * インシデントにレスポンダーを追加する
   *
   * @param incidentId - 対象インシデントの ID
   * @param responder - 追加するレスポンダー情報（ロール・ユーザー）
   * @returns レスポンダー追加後の最新インシデント
   * @throws インシデントが存在しない場合
   */
  async addResponder(
    incidentId: string,
    responder: Responder,
  ): Promise<Incident> {
    await incidentsCol.doc(incidentId).update({
      responders: FieldValue.arrayUnion(responder),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const updated = await this.findById(incidentId);
    if (!updated) throw new Error(`Incident not found: ${incidentId}`);
    return updated;
  },

  /**
   * インシデントのタイムラインにイベントを追加する
   *
   * @param incidentId - 対象インシデントの ID
   * @param event - 追加するタイムラインイベント
   */
  async addTimelineEvent(
    incidentId: string,
    event: AddTimelineEventInput,
  ): Promise<void> {
    const ref = timelineCol(incidentId).doc();
    const doc: TimelineEventDoc = {
      id: ref.id,
      type: event.type,
      actorId: event.actorId,
      actorName: event.actorName,
      note: event.note,
      occurredAt: Timestamp.fromDate(event.occurredAt),
    };
    await ref.set(doc);
  },

  /**
   * インシデントを解決済みに更新する
   *
   * @param id - 対象インシデントの ID
   * @param resolvedAt - 解決日時
   * @param resolvedBy - 解決操作を行ったユーザーの Slack ユーザー ID
   * @param resolvedByName - 解決操作を行ったユーザーの表示名
   */
  async resolve(
    id: string,
    resolvedAt: Date,
    resolvedBy: string,
    resolvedByName: string,
  ): Promise<void> {
    await incidentsCol.doc(id).update({
      status: "resolved",
      resolvedAt: Timestamp.fromDate(resolvedAt),
      resolvedBy,
      resolvedByName,
      updatedAt: FieldValue.serverTimestamp(),
    });
  },
};
