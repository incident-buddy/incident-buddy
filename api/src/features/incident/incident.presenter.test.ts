import { describe, expect, it } from "vitest";
import type { Incident } from "./incident.model.js";
import { buildIncidentMessage } from "./incident.presenter.js";

const baseIncident: Incident = {
  id: "INC001",
  title: "Database is down",
  description: "Primary DB not responding",
  status: "open",
  severity: "P1",
  serviceName: "",
  slackChannelId: "C000TEST",
  slackMessageTs: "",
  createdBy: "U000TEST",
  createdByName: "testuser",
  teamIds: [],
  serviceIds: [],
  responderIds: [],
  createdAt: new Date("2026-03-21T00:00:00Z"),
  resolvedAt: null,
  updatedAt: new Date("2026-03-21T00:00:00Z"),
};

describe("buildIncidentMessage", () => {
  it("incidentChannelId を渡すと通知メッセージにチャンネルリンクが含まれる", () => {
    const msg = buildIncidentMessage(baseIncident, { incidentChannelId: "C_INC_001" });
    expect(msg.text).toContain("<#C_INC_001>");
  });

  it("incidentChannelId を渡さないと通知メッセージにチャンネルリンクは含まれない", () => {
    const msg = buildIncidentMessage(baseIncident);
    expect(msg.text).not.toContain("<#");
  });


  it("attachments have a color", () => {
    const msg = buildIncidentMessage(baseIncident);
    expect(msg.attachments[0]?.color).toBeTruthy();
  });

  it("includes the incident title in the top-level text", () => {
    const msg = buildIncidentMessage(baseIncident);
    expect(msg.text).toBe("Incident Declared: Database is down");
  });

  it("includes description in the body block when present", () => {
    const msg = buildIncidentMessage(baseIncident);
    const bodyBlock = msg.attachments[0]?.blocks[1] as {
      text: { text: string };
    };
    expect(bodyBlock.text.text).toContain("Primary DB not responding");
  });

  it("omits description newline in body block when description is empty", () => {
    const msg = buildIncidentMessage({ ...baseIncident, description: "" });
    const bodyBlock = msg.attachments[0]?.blocks[1] as {
      text: { text: string };
    };
    expect(bodyBlock.text.text).toBe("*Database is down*");
  });

  it("includes <!here> mention in call-to-action block", () => {
    const msg = buildIncidentMessage(baseIncident);
    const ctaBlock = msg.attachments[0]?.blocks[2] as {
      text: { text: string };
    };
    expect(ctaBlock.text.text).toContain("<!here>");
  });

  it("includes incident metadata fields (id, severity, declaredBy, status)", () => {
    const msg = buildIncidentMessage(baseIncident);
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
