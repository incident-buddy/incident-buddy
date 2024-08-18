import assert from "node:assert";
import test from "node:test";
import { Config, isStdFieldKey } from "./index.ts";

test("Config.load", async (t) => {
  const config = await Config.load("config.yaml");
  assert(config);
  console.log(config.toString());
});

test("isStdFieldKey", (t) => {
  const stdKeys = ["description", "severity", "status"];
  for (const key of stdKeys) {
    assert(isStdFieldKey(key));
  }

  const invalidKeys = ["foo", "bar", "baz"];
  for (const key of invalidKeys) {
    assert(!isStdFieldKey(key));
  }
});

test("getFieldSchema", async (t) => {
  const config = await Config.load("config.yaml");
  const field1 = config.getFieldSchema("std.description");
  assert(field1.kind === "std");
  assert(field1.key === "description");
  assert(field1.type === "text");

  const field2 = config.getFieldSchema("std.severity");
  assert(field2.kind === "std");
  assert(field2.key === "severity");
  assert(field2.type === "singleSelect");
  assert(field2.items.length > 0);

  const field3 = config.getFieldSchema("std.status");
  assert(field3.kind === "std");
  assert(field3.key === "status");
  assert(field3.type === "singleSelect");
  assert(field3.items.length > 0);

  assert.throws(() => {
    config.getFieldSchema("std.foo");
  });

  const field4 = config.getFieldSchema("custom.service");
  assert(field4.kind === "custom");
  assert(field4.key === "service");
  assert(field4.type === "multiSelect");
  assert(field4.items.length > 0);

  const field5 = config.getFieldSchema("custom.triage");
  assert(field5.kind === "custom");
  assert(field5.key === "triage");
  assert(field5.type === "singleSelect");
  assert(field5.items.length > 0);

  const field6 = config.getFieldSchema("custom.affectedCustomerCount");
  assert(field6.kind === "custom");
  assert(field6.key === "affectedCustomerCount");
  assert(field6.type === "number");

  const field7 = config.getFieldSchema("custom.cause");
  assert(field7.kind === "custom");
  assert(field7.key === "cause");
  assert(field7.type === "text");

  const filed8 = config.getFieldSchema("custom.commanderRole");
  assert(filed8.kind === "custom");
  assert(filed8.key === "commanderRole");
  assert(filed8.type === "user");
});
