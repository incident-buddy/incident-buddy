import { getApps, initializeApp } from "firebase-admin/app";
import {
  type CollectionReference,
  getFirestore,
} from "firebase-admin/firestore";
import type {
  IncidentDoc,
  MemberDoc,
  ServiceDoc,
  TeamDoc,
  TimelineEventDoc,
} from "./types.js";

if (getApps().length === 0) {
  initializeApp({ projectId: process.env["FIRESTORE_PROJECT_ID"] });
}

const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

// firebase-admin の CollectionReference に型パラメーターを渡す overload がないため
// as unknown as でキャストする
export const incidentsCol = db.collection(
  "incidents",
) as unknown as CollectionReference<IncidentDoc>;

export const teamsCol = db.collection(
  "teams",
) as unknown as CollectionReference<TeamDoc>;

export const membersCol = db.collection(
  "members",
) as unknown as CollectionReference<MemberDoc>;

export const servicesCol = db.collection(
  "services",
) as unknown as CollectionReference<ServiceDoc>;

export function timelineCol(
  incidentId: string,
): CollectionReference<TimelineEventDoc> {
  return incidentsCol
    .doc(incidentId)
    .collection("timeline") as unknown as CollectionReference<TimelineEventDoc>;
}

export { db };
