import { Color, IncidentStatusType } from "@pb/api/incident/v1/incident_pb";

export type StatusType = keyof typeof IncidentStatusType;
export function statusTypeFromCode(n: number): StatusType {
  return IncidentStatusType[n] as StatusType;
}

export type ColorType = keyof typeof Color;
export function colorFromCode(n: number): ColorType {
  return Color[n] as ColorType;
}

export function statusStyle(color: ColorType) {
  switch (color) {
    case "RED":
      return {
        tag: {
          bg: "bg-red-400",
          bd: "bg-red-600",
        },
        circle: {
          bg: "bg-red-700",
        },
      };
    case "BLUE":
      return {
        tag: {
          bg: "bg-blue-400",
          bd: "bg-blue-600",
        },
        circle: {
          bg: "bg-blue-800",
        },
      };
    case "GREEN":
      return {
        tag: {
          bg: "bg-green-400",
          bd: "bg-green-600",
        },
        circle: {
          bg: "bg-green-700",
        },
      };
    default:
      return {
        tag: {
          bg: "bg-gray-400",
          bd: "bg-gray-600",
        },
      };
  }
}
