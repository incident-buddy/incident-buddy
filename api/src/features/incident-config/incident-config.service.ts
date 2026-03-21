import * as fs from "node:fs";
import type { IncidentConfig, NotificationRule, SeverityCondition } from "./incident-config.model.js";
import { parseIncidentConfig } from "./incident-config.parser.js";

function compareSeverity(
  severities: IncidentConfig["severities"],
  incidentSeverity: string,
  condition: SeverityCondition,
): boolean {
  const idx = severities.findIndex(
    (s) => s.label.toLowerCase() === incidentSeverity.toLowerCase(),
  );
  const condIdx = severities.findIndex(
    (s) => s.label.toLowerCase() === condition.label.toLowerCase(),
  );
  // いずれかが未定義なら false
  if (idx === -1 || condIdx === -1) return false;

  // ファイル先頭が最重要（インデックス小 = より重要）
  // >= High: idx <= condIdx（HightかそれよりindexIndex小 = より重要）
  if (condition.op === ">=") return idx <= condIdx;
  if (condition.op === "<=") return idx >= condIdx;
  return idx === condIdx;
}

export function matchRules(
  config: IncidentConfig,
  severity: string,
  serviceName: string,
): NotificationRule[] {
  return config.notificationRules.filter((rule) => {
    const { severity: sevCond, service: svcCond } = rule.conditions;

    if (sevCond !== undefined) {
      if (!compareSeverity(config.severities, severity, sevCond)) return false;
    }

    if (svcCond !== undefined) {
      if (!serviceName) return false;
      if (serviceName.toLowerCase() !== svcCond.toLowerCase()) return false;
    }

    return true;
  });
}

export async function loadConfig(filePath: string): Promise<IncidentConfig | null> {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return parseIncidentConfig(content);
  } catch {
    return null;
  }
}
