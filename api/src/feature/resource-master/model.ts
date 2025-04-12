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
  | User
  | SlackChannel
  | StdText;

export const valueTypes = {
  stdUser: "std:user",
  slackChannel: "slack:channel",
  text: "std:text",
} as const;

type User = typeof valueTypes.stdUser;
type SlackChannel = typeof valueTypes.slackChannel;
type StdText = typeof valueTypes.text;

export function toValueType(s: string): ValueType {
  switch (s) {
    case valueTypes.stdUser:
      return valueTypes.stdUser;
    case valueTypes.slackChannel:
      return valueTypes.slackChannel;
    case valueTypes.text:
      return valueTypes.text;
    default:
      console.error(`Unknown value type: ${s}`);
      throw new Error(`Unknown value type: ${s}`);
  }
}
