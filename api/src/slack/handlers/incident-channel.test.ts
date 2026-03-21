import { describe, expect, it } from "vitest";
import { buildChannelName } from "./incident-channel.js";

describe("buildChannelName", () => {
  it("inc-YYYYMMDD-NNN 形式の文字列を生成する", () => {
    expect(buildChannelName(new Date("2026-03-21T00:00:00Z"), 1)).toBe("inc-20260321-001");
  });

  it("連番は3桁ゼロ埋めになる", () => {
    expect(buildChannelName(new Date("2026-03-21T00:00:00Z"), 9)).toBe("inc-20260321-009");
    expect(buildChannelName(new Date("2026-03-21T00:00:00Z"), 99)).toBe("inc-20260321-099");
  });

  it("連番が100以上のときはゼロ埋めなし", () => {
    expect(buildChannelName(new Date("2026-03-21T00:00:00Z"), 100)).toBe("inc-20260321-100");
  });

  it("月・日が1桁のときはゼロ埋めになる", () => {
    expect(buildChannelName(new Date("2026-01-05T00:00:00Z"), 1)).toBe("inc-20260105-001");
  });
});
