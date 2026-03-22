import { describe, expect, it } from "vitest";
import type { Incident } from "./incident.model.js";
import {
  buildChannelWelcomeMessage,
  buildIncidentMessage,
} from "./incident.presenter.js";

const baseIncident: Incident = {
  id: "INC001",
  title: "Database is down",
  description: "Primary DB not responding",
  status: "open",
  severity: "P1",
  serviceName: "",
  slackChannelId: "C000TEST",
  slackMessageTs: "",
  incidentChannelId: "C_INC_001",
  createdBy: "U000TEST",
  createdByName: "testuser",
  teamIds: [],
  serviceIds: [],
  responders: [],
  createdAt: new Date("2026-03-21T00:00:00Z"),
  resolvedAt: null,
  updatedAt: new Date("2026-03-21T00:00:00Z"),
};

describe("buildIncidentMessage", () => {
  it("incidentChannelId を渡すと通知メッセージにチャンネルリンクが含まれる", () => {
    const msg = buildIncidentMessage({
      incident: baseIncident,
      options: { incidentChannelId: "C_INC_001" },
    });
    expect(msg.text).toContain("<#C_INC_001>");
  });

  it("incidentChannelId を渡さないと通知メッセージにチャンネルリンクは含まれない", () => {
    const msg = buildIncidentMessage({ incident: baseIncident });
    expect(msg.text).not.toContain("<#");
  });

  it("attachments have a color", () => {
    const msg = buildIncidentMessage({ incident: baseIncident });
    expect(msg.attachments[0]?.color).toBeTruthy();
  });

  it("includes the incident title in the top-level text", () => {
    const msg = buildIncidentMessage({ incident: baseIncident });
    expect(msg.text).toBe("Incident Declared: Database is down");
  });

  it("includes description in the body block when present", () => {
    const msg = buildIncidentMessage({ incident: baseIncident });
    const bodyBlock = msg.attachments[0]?.blocks[1] as {
      text: { text: string };
    };
    expect(bodyBlock.text.text).toContain("Primary DB not responding");
  });

  it("omits description newline in body block when description is empty", () => {
    const msg = buildIncidentMessage({
      incident: { ...baseIncident, description: "" },
    });
    const bodyBlock = msg.attachments[0]?.blocks[1] as {
      text: { text: string };
    };
    expect(bodyBlock.text.text).toBe("*Database is down*");
  });

  it("includes <!here> mention in call-to-action block", () => {
    const msg = buildIncidentMessage({ incident: baseIncident });
    const ctaBlock = msg.attachments[0]?.blocks[2] as {
      text: { text: string };
    };
    expect(ctaBlock.text.text).toContain("<!here>");
  });

  it("includes incident metadata fields (id, severity, declaredBy, status)", () => {
    const msg = buildIncidentMessage({ incident: baseIncident });
    const metaBlock = msg.attachments[0]?.blocks[0] as {
      fields: Array<{ text: string }>;
    };
    const texts = metaBlock.fields.map((f) => f.text);
    expect(texts).toContain("*Incident ID*\nINC001");
    expect(texts).toContain("*Severity*\nP1");
    expect(texts).toContain("*Declared by*\n<@U000TEST>");
    expect(texts).toContain("*Status*\nopen");
  });
});

describe("buildChannelWelcomeMessage", () => {
  it("インシデントタイトルが含まれる", () => {
    const msg = buildChannelWelcomeMessage(baseIncident);
    expect(JSON.stringify(msg)).toContain("Database is down");
  });

  it("severity が含まれる", () => {
    const msg = buildChannelWelcomeMessage(baseIncident);
    expect(JSON.stringify(msg)).toContain("P1");
  });

  it("description が含まれる", () => {
    const msg = buildChannelWelcomeMessage(baseIncident);
    expect(JSON.stringify(msg)).toContain("Primary DB not responding");
  });

  it("宣言者名が含まれる", () => {
    const msg = buildChannelWelcomeMessage(baseIncident);
    expect(JSON.stringify(msg)).toContain("testuser");
  });

  it("description が空のとき description フィールドを含まない", () => {
    const msg = buildChannelWelcomeMessage({
      ...baseIncident,
      description: "",
    });
    const json = JSON.stringify(msg);
    expect(json).not.toContain("Primary DB not responding");
  });

  it("serviceName が空のとき serviceName フィールドを含まない", () => {
    const msg = buildChannelWelcomeMessage({
      ...baseIncident,
      serviceName: "",
    });
    const json = JSON.stringify(msg);
    // serviceName が空文字のときにサービス名ラベルが出ないことを確認
    expect(json).not.toContain("*Service*");
  });
});
