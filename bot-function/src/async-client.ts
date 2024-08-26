import process from "node:process";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import type { AsyncTask } from "model/async-task.ts";

interface AsyncClient {
  exec(payload: AsyncTask): Promise<void>;
}

class LambdaAsyncClient implements AsyncClient {
  private lambdaClient: LambdaClient;
  private executorFunctionName: string;

  constructor() {
    this.lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });
    const functionName = process.env.EXECUTOR_FUNCTION;
    if (!functionName) {
      throw new Error("EXECUTOR_FUNCTION is not set");
    }
    this.executorFunctionName = functionName;
  }
  async exec(payload: AsyncTask): Promise<void> {
    const command = new InvokeCommand({
      InvocationType: "Event",
      FunctionName: this.executorFunctionName,
      Payload: JSON.stringify(payload),
    });

    await this.lambdaClient.send(command);
  }
}

class LocalAsyncClient implements AsyncClient {
  private executorUrl: string;
  constructor() {
    const url = process.env.LOCAL_EXECUTOR_URL;
    if (!url) {
      throw new Error("EXECUTOR_URL is not set");
    }
    this.executorUrl = url;
  }

  async exec(payload: AsyncTask): Promise<void> {
    console.log("executing: ", payload);
    await fetch(this.executorUrl, {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}

export const asyncClient = process.env.LOCAL_EXECUTOR_URL
  ? new LocalAsyncClient()
  : new LambdaAsyncClient();
