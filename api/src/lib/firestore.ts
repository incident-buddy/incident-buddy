import { getApps, initializeApp } from "firebase-admin/app";
import { Timestamp, getFirestore } from "firebase-admin/firestore";

type TimestampToDate<T> =
  T extends Timestamp ? Date
  : T extends null ? null
  : T extends Array<infer U> ? Array<TimestampToDate<U>>
  : T extends object ? { [K in keyof T]: TimestampToDate<T[K]> }
  : T;

function isTimestamp(value: unknown): value is Timestamp {
  return (
    value !== null &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as Record<string, unknown>)["toDate"] === "function"
  );
}

type DateToTimestamp<T> =
  T extends Date ? Timestamp
  : T extends null ? null
  : T extends Array<infer U> ? Array<DateToTimestamp<U>>
  : T extends object ? { [K in keyof T]: DateToTimestamp<T[K]> }
  : T;

export function toTimestamps<T extends object>(doc: T): DateToTimestamp<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc)) {
    if (value instanceof Date) {
      result[key] = Timestamp.fromDate(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item: unknown) =>
        item !== null && typeof item === "object" ? toTimestamps(item) : item
      );
    } else if (value !== null && typeof value === "object") {
      result[key] = toTimestamps(value);
    } else {
      result[key] = value;
    }
  }
  return result as DateToTimestamp<T>;
}

export function fromTimestamps<T extends object>(doc: T): TimestampToDate<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc)) {
    if (isTimestamp(value)) {
      result[key] = value.toDate();
    } else if (Array.isArray(value)) {
      result[key] = value.map((item: unknown) =>
        item !== null && typeof item === "object" ? fromTimestamps(item) : item
      );
    } else if (value !== null && typeof value === "object") {
      result[key] = fromTimestamps(value);
    } else {
      result[key] = value;
    }
  }
  // iterative construction で型証明が困難なため cast
  return result as TimestampToDate<T>;
}

if (getApps().length === 0) {
  initializeApp({ projectId: process.env.FIRESTORE_PROJECT_ID });
}

const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

export { db };
