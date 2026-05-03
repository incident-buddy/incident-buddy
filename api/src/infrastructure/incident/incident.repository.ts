import type { Incident } from "@src/domain/incident/incident.model";
import type { IncidentRepository } from "@src/domain/incident/incident.repository";
import { db, fromTimestamps, toTimestamps } from "@src/lib/firestore";
import { withSpan } from "@src/lib/telemetry.js";
import type { CollectionReference } from "firebase-admin/firestore";

type IncidentDoc = ReturnType<typeof toTimestamps<Incident>>;

// firebase-admin の CollectionReference に型パラメーターを渡す overload がないため cast
const incidentsCol = db.collection(
  "incidents",
) as unknown as CollectionReference<IncidentDoc>;

export const incidentRepository: IncidentRepository = {
  resolve(id) {
    return withSpan(
      "incident.repository.resolve",
      { collection: "incidents", operation: "resolve" },
      async () => {
        const snap = await incidentsCol.doc(id).get();
        const data = snap.data();
        if (!data) return undefined;
        return fromTimestamps(data);
      },
    );
  },

  store(incident) {
    return withSpan(
      "incident.repository.store",
      { collection: "incidents", operation: "store" },
      async () => {
        await incidentsCol.doc(incident.id).set(toTimestamps(incident));
      },
    );
  },
};
