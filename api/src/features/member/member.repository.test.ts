import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "../../db/firestore.js";
import * as telemetry from "../../telemetry.js";
import { memberRepository } from "./member.repository.js";

async function clearMembers() {
  const snap = await db.collection("members").get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

describe("memberRepository.upsert", () => {
  afterEach(clearMembers);

  it("creates a member document when it does not exist", async () => {
    await memberRepository.upsert("U001", "Alice");

    const snap = await db.collection("members").doc("U001").get();
    expect(snap.exists).toBe(true);
    expect(snap.data()).toMatchObject({
      slackUserId: "U001",
      displayName: "Alice",
    });
  });

  it("updates displayName on subsequent calls (merge)", async () => {
    await memberRepository.upsert("U001", "Alice");
    await memberRepository.upsert("U001", "Alice Updated");

    const snap = await db.collection("members").doc("U001").get();
    expect(snap.data()?.displayName).toBe("Alice Updated");
  });

  it("upsert: 正しいスパン名と属性で withSpan が呼ばれる", async () => {
    const spy = vi.spyOn(telemetry, "withSpan").mockImplementation((_n, _a, fn) => fn());
    await memberRepository.upsert("U_SPY", "SpyUser");
    expect(spy).toHaveBeenCalledWith(
      "member.repository.upsert",
      { collection: "members", operation: "upsert" },
      expect.any(Function),
    );
    spy.mockRestore();
  });

  it("preserves existing fields not in the upsert payload (merge)", async () => {
    await db
      .collection("members")
      .doc("U001")
      .set({
        slackUserId: "U001",
        displayName: "Alice",
        avatarUrl: "https://example.com/avatar.png",
        teamIds: ["T001"],
      });

    await memberRepository.upsert("U001", "Alice Renamed");

    const snap = await db.collection("members").doc("U001").get();
    expect(snap.data()?.avatarUrl).toBe("https://example.com/avatar.png");
    expect(snap.data()?.teamIds).toEqual(["T001"]);
  });
});
