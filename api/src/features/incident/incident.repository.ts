import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { incidentsCol, timelineCol } from "../../db/firestore.js";
import type { AddTimelineEventInput, CreateIncidentInput, IncidentDoc, TimelineEventDoc } from "../../db/types.js";
import type { Incident, IncidentStatus, Responder } from "./incident.model.js";

/**
 * `incidentRepository.update` に渡すフィールド更新パッチ
 *
 * @description ドメイン型で表現する。Firestore 固有の型（`FieldValue`, `Timestamp`）は
 * `update` 内部に封じ込め、呼び出し元に露出しない。
 * `responders.add` は `arrayUnion`、`responders.remove` は `arrayRemove` に変換される。
 * `updatedAt` は `update` が常にサーバータイムスタンプで上書きする。
 */
type IncidentPatch = {
  status?: IncidentStatus;
  resolvedAt?: Date;
  resolvedBy?: string | null;
  resolvedByName?: string | null;
  responders?: { add?: Responder; remove?: Responder };
};

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
   * @param limit - 取得件数の上限（デフォルト: 10）。Firestore クエリ側で制限し全件取得を防ぐ
   * @returns オープン中のインシデント一覧（新しい順）
   */
  async findOpen(limit = 10): Promise<Incident[]> {
    const snap = await incidentsCol
      .where("status", "==", "open")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    return snap.docs.map((d) => toDomain(d.data()));
  },

  /**
   * インシデントの任意フィールドを更新する
   *
   * @description ドメイン型を Firestore 型に変換する責務を持つ。
   * `responders.add` は `arrayUnion`、`responders.remove` は `arrayRemove` に変換される。
   * `updatedAt` は常にサーバータイムスタンプで上書きされる。
   * @param id - 対象インシデントの ID
   * @param patch - 更新するフィールドのパッチ
   */
  async update(id: string, patch: IncidentPatch): Promise<void> {
    const firestoreUpdate: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (patch.status !== undefined) firestoreUpdate.status = patch.status;
    if (patch.resolvedAt !== undefined) firestoreUpdate.resolvedAt = Timestamp.fromDate(patch.resolvedAt);
    if (patch.resolvedBy !== undefined) firestoreUpdate.resolvedBy = patch.resolvedBy;
    if (patch.resolvedByName !== undefined) firestoreUpdate.resolvedByName = patch.resolvedByName;
    if (patch.responders?.add !== undefined) firestoreUpdate.responders = FieldValue.arrayUnion(patch.responders.add);
    if (patch.responders?.remove !== undefined) firestoreUpdate.responders = FieldValue.arrayRemove(patch.responders.remove);
    await incidentsCol.doc(id).update(firestoreUpdate);
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
};
