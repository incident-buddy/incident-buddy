export type ResourceMaster = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  icon: IconType,
  category: string;
  attributes: {
    code: string;
    name: string;
    isArray: boolean;
    orderNo: number;
    valueType: ValueType;
  }[];
};

export type ValueType =
  | Reference
  | User
  | SlackChannelId
  | StdText;

export const valueTypes = {
  reference: "reference",
  stdUser: "std:user",
  slackChannelId: "slack:channel:id",
  text: "std:text",
} as const;

type Reference = typeof valueTypes.reference;
type User = typeof valueTypes.stdUser;
type SlackChannelId = typeof valueTypes.slackChannelId;
type StdText = typeof valueTypes.text;

export type IconType =
  | IconSlack
  | IconTeam
  | IconBox
  | IconFunction
;

export const iconTypes = {
  slack: "slack",
  team: "team",
  box: "box",
  function: "function",
} as const;

type IconSlack = typeof iconTypes.slack;
type IconTeam = typeof iconTypes.team;
type IconBox = typeof iconTypes.box;
type IconFunction = typeof iconTypes.function;

export function toValueType(s: string): ValueType {
  switch (s) {
    case valueTypes.reference:
      return valueTypes.reference;
    case valueTypes.stdUser:
      return valueTypes.stdUser;
    case valueTypes.slackChannelId:
      return valueTypes.slackChannelId;
    case valueTypes.text:
      return valueTypes.text;
    default:
      console.error(`Unknown value type: ${s}`);
      throw new Error(`Unknown value type: ${s}`);
  }
}
