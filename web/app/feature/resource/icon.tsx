
// see: api/src/feature/resource-master/model.ts
import {Box, FunctionSquare, Shapes, Slack, Users} from "lucide-react";
import type {JSX} from "react";

const iconTypes = {
  slack: "slack",
  team: "team",
  box: "box",
  function: "function",
} as const;

export function toIcon(s: string): JSX.Element {
  const className = "w-4 h-4 mt-1";
  switch (s) {
    case iconTypes.slack:
      return <Slack className={className} />;
    case iconTypes.team:
      return <Users className={className} />;
    case iconTypes.box:
      return <Box className={className} />;
    case iconTypes.function:
      return <FunctionSquare className={className} />;
    default:
      return <Shapes className={className} />;
  }
}