import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { incidentsCol, timelineCol } from "../../db/firestore.js";
import type { CreateIncidentInput, IncidentDoc, TimelineEventDoc } from "../../db/types.js";
import type { Incident, Responder } from "./incident.model.js";

function toDomain(doc: IncidentDoc): Incident {
  return {
    ...doc,
    createdAt: doc.createdAt.toDate(),
    updatedAt: doc.updatedAt.toDate(),
    resolvedAt: doc.resolvedAt?.toDate() ?? null,
  };
}

export const incidentRepository = {
  async create(input: CreateIncidentInput): Promise<Incident> {
    const ref = incidentsCol.doc();
    const now = Timestamp.now();
    const doc: IncidentDoc = {
      ...input,
      id: ref.id,
      status: "open",
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
    };
    await ref.set(doc);
    return toDomain(doc);
  },

  async findById(id: string): Promise<Incident | null> {
    const snap = await incidentsCol.doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data();
    return data ? toDomain(data) : null;
  },

  async findByChannelId(channelId: string): Promise<Incident | null> {
    const snap = await incidentsCol
      .where("incidentChannelId", "==", channelId)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const data = snap.docs[0]?.data();
    return data ? toDomain(data) : null;
  },

  async findOpen(): Promise<Incident[]> {
    const snap = await incidentsCol
      .where("status", "==", "open")
      .orderBy("createdAt", "desc")
      .get();
    return snap.docs.map((d) => toDomain(d.data()));
  },

  async updateIncidentChannelId(id: string, channelId: string): Promise<void> {
    await incidentsCol.doc(id).update({
      incidentChannelId: channelId,
      updatedAt: FieldValue.serverTimestamp(),
    });
  },

  async updateSlackMessageTs(id: string, ts: string): Promise<void> {
    await incidentsCol.doc(id).update({
      slackMessageTs: ts,
      updatedAt: FieldValue.serverTimestamp(),
    });
  },

  async updateWelcomeMessageTs(id: string, ts: string): Promise<void> {
    await incidentsCol.doc(id).update({
      welcomeMessageTs: ts,
      updatedAt: FieldValue.serverTimestamp(),
    });
  },

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

  async addTimelineEvent(
    incidentId: string,
    event: Omit<TimelineEventDoc, "id">,
  ): Promise<void> {
    const ref = timelineCol(incidentId).doc();
    const doc: TimelineEventDoc = { ...event, id: ref.id };
    await ref.set(doc);
  },

  async resolve(id: string): Promise<void> {
    await incidentsCol.doc(id).update({
      status: "resolved",
      resolvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  },
};
