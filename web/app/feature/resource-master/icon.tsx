// see: api/src/feature/resource-master/model.ts
import { Box, FunctionSquare, Shapes, Slack, Users } from "lucide-react";
import type { JSX } from "react";

export const iconTypes = [
  "default",
  "team",
  "box",
  "function",
  "slack",
] as const;

export type IconType = (typeof iconTypes)[number];

export function toIcon(s: string, size?: "sm" | "lg"): JSX.Element {
  let className = "w-5 h-5";
  if (size === "lg") {
    className = "w-10 h-10 mt-1";
  }
  if (size === "sm") {
    className = "w-4 h-4 mt-1";
  }
  switch (s) {
    case "slack":
      return <Slack className={className} />;
    case "team":
      return <Users className={className} />;
    case "box":
      return <Box className={className} />;
    case "function":
      return <FunctionSquare className={className} />;
    case "default":
      return <Shapes className={className} />;
    default:
      return <Shapes className={className} />;
  }
}
