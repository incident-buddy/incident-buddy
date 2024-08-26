import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  type KeySchemaElement,
  ListTablesCommand,
  ScalarAttributeType,
} from "@aws-sdk/client-dynamodb";
import type { Config } from "config";

export interface Datastore {
  ensureTable(): Promise<void>;
  // store(incident: Incident): Promise<void>;
  // fetch(id: string): Promise<Incident | null>;
}

class DynamoDBDatastore implements Datastore {
  private client: DynamoDBClient;

  constructor(private config: Config) {
    this.client = new DynamoDBClient({
      endpoint: process.env.LOCALSTACK_URL,
      region: process.env.AWS_REGION,
    });
  }

  async ensureTable(): Promise<void> {
    const res = await this.client.send(new ListTablesCommand());
    if (!res.TableNames) {
      console.error(`Something went wrong: ${res}`);
      return Promise.reject();
    }
    const tableName = this.config.datastoreConfig.table;
    if (!(tableName in res.TableNames)) {
      console.log(`Table "${tableName}" does not exist. Creating...`);
      const schema = asDynamoSchema(this.config);
      await this.client.send(
        new CreateTableCommand({
          TableName: tableName,
          AttributeDefinitions: schema.keyAttrs,
          KeySchema: schema.keySchema,
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
        }),
      );
      const created = await this.client.send(
        new DescribeTableCommand({ TableName: tableName }),
      );
      console.log(
        `Table "${tableName}" created: ${JSON.stringify(created.Table)}`,
      );
    }
  }
}

export function DataStore(config: Config) {
  return new DynamoDBDatastore(config);
}

function asDynamoSchema(config: Config) {
  const keyAttrs = [
    { AttributeName: "channelId", AttributeType: ScalarAttributeType.S },
    { AttributeName: "createdAt", AttributeType: ScalarAttributeType.N },
  ];
  const keySchema: KeySchemaElement[] = [
    { AttributeName: "channelId", KeyType: "HASH" },
    { AttributeName: "createdAt", KeyType: "RANGE" },
  ];
  const stdAttrs = Object.keys(config.underlying.stdField).map((key) => ({
    AttributeName: key,
    AttributeType: ScalarAttributeType.S, // any type stored as JSON string
  }));

  const customAttrs = Object.keys(config.underlying.customField).map((key) => {
    const field = config.underlying.customField[key];
    if (!field) {
      throw new Error(`Custom field for "${key}" must be exist: ${field}`);
    }
    switch (field.type) {
      case "text":
      case "user":
      // store as JSON string
      case "singleSelect":
      case "multiSelect":
        return { AttributeName: key, AttributeType: ScalarAttributeType.S };
      case "number":
        return { AttributeName: key, AttributeType: ScalarAttributeType.N };
    }
  });

  return {
    keyAttrs,
    keySchema,
    stdAttrs,
    customAttrs,
  };
}
