import { Color, IncidentStatusType } from "@pb/api/incident/v1/incident_pb";

export type StatusType = keyof typeof IncidentStatusType;
export function statusTypeFromCode(n: number): StatusType {
  return IncidentStatusType[n] as StatusType;
}

export type ColorType = keyof typeof Color;
export function colorFromCode(n: number): ColorType {
  return Color[n] as ColorType;
}
