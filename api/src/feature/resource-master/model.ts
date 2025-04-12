export type ResourceMaster = {
  id: string;
  category: string;
  code: string;
  description: string | null;
  name: string;
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
