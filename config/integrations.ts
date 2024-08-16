import { z } from "zod";

const SlackIntegration = z.object({
  baseChannelId: z.string(),
  channelPrefix: z.string(),
});

const DynamoDBIntegration = z.object({
  type: z.literal("dynamodb"),
  region: z.string(),
  table: z.string(),
});

export const Integration = z.object({
  slack: SlackIntegration,
  datastore: DynamoDBIntegration,
});
