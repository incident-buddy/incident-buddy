import { describe, expect, it } from "vitest";
import type { IncidentConfig } from "./incident-config.model.js";
import { matchRules } from "./incident-config.service.js";

const CONFIG: IncidentConfig = {
  severities: [
    { label: "Critical", description: "完全停止" },
    { label: "High", description: "部分的影響" },
    { label: "Medium", description: "一部劣化" },
    { label: "Low", description: "軽微" },
  ],
  services: [
    { label: "payment-api", description: "決済" },
    { label: "user-service", description: "ユーザー" },
  ],
  roles: [],
  notificationRules: [
    {
      name: "Payment High or Above",
      conditions: {
        severity: { op: ">=", label: "High" },
        service: "payment-api",
      },
      actions: { mentions: ["@payment-lead"] },
    },
    {
      name: "All Critical",
      conditions: { severity: { op: "==", label: "Critical" } },
      actions: { mentions: ["@here"] },
    },
    {
      name: "User Service Any",
      conditions: { service: "user-service" },
      actions: { mentions: [] },
    },
  ],
};

describe("matchRules", () => {
  it("Critical + payment-api → Payment High or Above と All Critical の両方にマッチ", () => {
    const matched = matchRules({
      config: CONFIG,
      severity: "Critical",
      serviceName: "payment-api",
    });
    expect(matched.map((r) => r.name)).toEqual(
      expect.arrayContaining(["Payment High or Above", "All Critical"]),
    );
    expect(matched).toHaveLength(2);
  });

  it("High + payment-api → Payment High or Above のみにマッチ", () => {
    const matched = matchRules({
      config: CONFIG,
      severity: "High",
      serviceName: "payment-api",
    });
    expect(matched.map((r) => r.name)).toEqual(["Payment High or Above"]);
  });

  it("Medium + payment-api → どのルールにもマッチしない", () => {
    const matched = matchRules({
      config: CONFIG,
      severity: "Medium",
      serviceName: "payment-api",
    });
    expect(matched).toHaveLength(0);
  });

  it("Low + user-service → User Service Any にマッチ", () => {
    const matched = matchRules({
      config: CONFIG,
      severity: "Low",
      serviceName: "user-service",
    });
    expect(matched.map((r) => r.name)).toEqual(["User Service Any"]);
  });

  it("service名の大文字小文字を無視してマッチする", () => {
    const matched = matchRules({
      config: CONFIG,
      severity: "High",
      serviceName: "Payment-API",
    });
    expect(matched).toHaveLength(1);
    expect(matched[0]?.name).toBe("Payment High or Above");
  });

  it("Critical + user-service → All Critical と User Service Any にマッチ", () => {
    const matched = matchRules({
      config: CONFIG,
      severity: "Critical",
      serviceName: "user-service",
    });
    expect(matched.map((r) => r.name)).toEqual(
      expect.arrayContaining(["All Critical", "User Service Any"]),
    );
  });

  it("存在しないseverityでは何にもマッチしない", () => {
    const matched = matchRules({
      config: CONFIG,
      severity: "P1",
      serviceName: "payment-api",
    });
    expect(matched).toHaveLength(0);
  });

  it("serviceName が空文字のとき、service条件のみのルールにはマッチしない", () => {
    const matched = matchRules({
      config: CONFIG,
      severity: "Critical",
      serviceName: "",
    });
    // All Critical のみマッチ（serviceなし）
    expect(matched.map((r) => r.name)).toEqual(["All Critical"]);
  });

  it("<= Medium は Medium と Low にマッチする", () => {
    const configWithLeq: IncidentConfig = {
      ...CONFIG,
      notificationRules: [
        {
          name: "Low Priority",
          conditions: { severity: { op: "<=", label: "Medium" } },
          actions: { mentions: [] },
        },
      ],
    };
    expect(
      matchRules({
        config: configWithLeq,
        severity: "Medium",
        serviceName: "",
      }).map((r) => r.name),
    ).toEqual(["Low Priority"]);
    expect(
      matchRules({
        config: configWithLeq,
        severity: "Low",
        serviceName: "",
      }).map((r) => r.name),
    ).toEqual(["Low Priority"]);
    expect(
      matchRules({ config: configWithLeq, severity: "High", serviceName: "" }),
    ).toHaveLength(0);
    expect(
      matchRules({
        config: configWithLeq,
        severity: "Critical",
        serviceName: "",
      }),
    ).toHaveLength(0);
  });
});
