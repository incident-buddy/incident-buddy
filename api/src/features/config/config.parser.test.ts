import { describe, expect, it } from "vitest";
import { parseIncidentConfig } from "./incident-config.parser.js";

const FULL_CONFIG = `# Incident Config

## Severities

### Critical
本番サービスが完全停止している

### High
本番サービスが部分的に影響を受けている

### Medium
機能の一部が劣化している

### Low
軽微な問題

## Services

### payment-api
決済処理サービス

### user-service
ユーザー管理サービス

## Notification Rules

### Payment High or Above
- severity: >= High
- service: payment-api
- mention: @payment-lead @oncall-group

### All Critical
- severity: Critical
- mention: @here

### User Service Any
- service: user-service
`;

describe("parseIncidentConfig", () => {
  describe("Severities", () => {
    it("ラベルと説明文をパースする", () => {
      const config = parseIncidentConfig(FULL_CONFIG);
      expect(config.severities).toHaveLength(4);
      expect(config.severities[0]).toEqual({
        label: "Critical",
        description: "本番サービスが完全停止している",
      });
      expect(config.severities[1]).toEqual({
        label: "High",
        description: "本番サービスが部分的に影響を受けている",
      });
      expect(config.severities[2]).toEqual({
        label: "Medium",
        description: "機能の一部が劣化している",
      });
      expect(config.severities[3]).toEqual({
        label: "Low",
        description: "軽微な問題",
      });
    });

    it("記載順が保たれる", () => {
      const config = parseIncidentConfig(FULL_CONFIG);
      expect(config.severities.map((s) => s.label)).toEqual([
        "Critical",
        "High",
        "Medium",
        "Low",
      ]);
    });
  });

  describe("Services", () => {
    it("ラベルと説明文をパースする", () => {
      const config = parseIncidentConfig(FULL_CONFIG);
      expect(config.services).toHaveLength(2);
      expect(config.services[0]).toEqual({
        label: "payment-api",
        description: "決済処理サービス",
      });
      expect(config.services[1]).toEqual({
        label: "user-service",
        description: "ユーザー管理サービス",
      });
    });
  });

  describe("Notification Rules", () => {
    it("severity + service のAND条件ルールをパースする", () => {
      const config = parseIncidentConfig(FULL_CONFIG);
      const rule = config.notificationRules.find(
        (r) => r.name === "Payment High or Above",
      );
      expect(rule).toBeDefined();
      expect(rule?.conditions.severity).toEqual({ op: ">=", label: "High" });
      expect(rule?.conditions.service).toBe("payment-api");
      expect(rule?.actions.mentions).toEqual([
        "@payment-lead",
        "@oncall-group",
      ]);
    });

    it("severityのみのルールをパースする", () => {
      const config = parseIncidentConfig(FULL_CONFIG);
      const rule = config.notificationRules.find(
        (r) => r.name === "All Critical",
      );
      expect(rule).toBeDefined();
      expect(rule?.conditions.severity).toEqual({
        op: "==",
        label: "Critical",
      });
      expect(rule?.conditions.service).toBeUndefined();
      expect(rule?.actions.mentions).toEqual(["@here"]);
    });

    it("serviceのみのルールをパースする", () => {
      const config = parseIncidentConfig(FULL_CONFIG);
      const rule = config.notificationRules.find(
        (r) => r.name === "User Service Any",
      );
      expect(rule).toBeDefined();
      expect(rule?.conditions.severity).toBeUndefined();
      expect(rule?.conditions.service).toBe("user-service");
      expect(rule?.actions.mentions).toEqual([]);
    });
  });

  describe("空ファイルや不完全な入力", () => {
    it("空文字列を渡すと空の設定を返す", () => {
      const config = parseIncidentConfig("");
      expect(config.severities).toHaveLength(0);
      expect(config.services).toHaveLength(0);
      expect(config.notificationRules).toHaveLength(0);
    });

    it("Severitiesセクションのみのファイルをパースできる", () => {
      const config = parseIncidentConfig(
        "## Severities\n\n### Critical\n本番停止\n",
      );
      expect(config.severities).toHaveLength(1);
      expect(config.services).toHaveLength(0);
      expect(config.notificationRules).toHaveLength(0);
    });
  });
});
