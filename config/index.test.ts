import assert from "node:assert";
import test from "node:test";
import { Config } from "./index.ts";

test("Config.load", async (t) => {
  const config = await Config.load("config.yaml");
  assert(config);
  console.log(config.toString());
});
