import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { incidentsCol } from "../../db/firestore.js";
import type { CreateIncidentInput, IncidentDoc } from "../../db/types.js";

export const incidentRepository = {
  async create(input: CreateIncidentInput): Promise<IncidentDoc> {
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
    return doc;
  },

  async findById(id: string): Promise<IncidentDoc | null> {
    const snap = await incidentsCol.doc(id).get();
    return snap.exists ? (snap.data() ?? null) : null;
  },

  async findOpen(): Promise<IncidentDoc[]> {
    const snap = await incidentsCol
      .where("status", "==", "open")
      .orderBy("createdAt", "desc")
      .get();
    return snap.docs.map((d) => d.data());
  },

  async updateSlackMessageTs(id: string, ts: string): Promise<void> {
    await incidentsCol.doc(id).update({
      slackMessageTs: ts,
      updatedAt: FieldValue.serverTimestamp(),
    });
  },

  async resolve(id: string): Promise<void> {
    await incidentsCol.doc(id).update({
      status: "resolved",
      resolvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  },
};
