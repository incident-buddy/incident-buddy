import assert from "node:assert";
import test from "node:test";
import { Config } from "./config";

test("Config.load", async (t) => {
  const config = await Config.load("config.yaml");
  assert(config);
});
