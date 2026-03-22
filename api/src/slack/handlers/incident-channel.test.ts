import { describe, expect, it } from "vitest";
import { buildChannelName } from "./incident-channel.js";

describe("buildChannelName", () => {
  it("inc-YYYYMMDD-NNN 形式の文字列を生成する", () => {
    expect(buildChannelName({ date: new Date("2026-03-21T00:00:00Z"), seq: 1 })).toBe(
      "inc-20260321-001",
    );
  });

  it("連番は3桁ゼロ埋めになる", () => {
    expect(buildChannelName({ date: new Date("2026-03-21T00:00:00Z"), seq: 9 })).toBe(
      "inc-20260321-009",
    );
    expect(buildChannelName({ date: new Date("2026-03-21T00:00:00Z"), seq: 99 })).toBe(
      "inc-20260321-099",
    );
  });

  it("連番が100以上のときはゼロ埋めなし", () => {
    expect(buildChannelName({ date: new Date("2026-03-21T00:00:00Z"), seq: 100 })).toBe(
      "inc-20260321-100",
    );
  });

  it("月・日が1桁のときはゼロ埋めになる", () => {
    expect(buildChannelName({ date: new Date("2026-01-05T00:00:00Z"), seq: 1 })).toBe(
      "inc-20260105-001",
    );
  });
});
