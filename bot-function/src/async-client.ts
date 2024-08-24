import process from "node:process";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";

type AsyncTaskPayload = {
  test: string;
};

interface AsyncClient {
  exec(payload: AsyncTaskPayload): Promise<void>;
}

class LabmdaAsyncClient implements AsyncClient {
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
  async exec(payload: AsyncTaskPayload): Promise<void> {
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
    const url = process.env.EXECUTOR_URL;
    if (!url) {
      throw new Error("EXECUTOR_URL is not set");
    }
    this.executorUrl = url;
  }

  async exec(payload: AsyncTaskPayload): Promise<void> {
    console.log("executing: ", payload);
    await fetch(this.executorUrl, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}
