import "react-router";
import { createRequestHandler } from "@react-router/express";
import express from "express";
import type { Transport } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-node";

declare module "react-router" {
  interface AppLoadContext {
    transport: Transport;
  }
}

export const app = express();

const transportBaseUrl = process.env.TRANSPORT_BASE_URL;
if (!transportBaseUrl) {
  throw new Error("TRANSPORT_BASE_URL environment variable is not set");
}
const transport = createConnectTransport({
  httpVersion: "1.1",
  baseUrl: transportBaseUrl,
});

app.use(
  createRequestHandler({
    build: () => import("virtual:react-router/server-build"),
    getLoadContext() {
      return {
        transport,
      };
    },
  }),
);
