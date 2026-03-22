import type {
  ConfigLoadResult,
  IncidentConfig,
  NotificationRule,
} from "./incident-config.model.js";

const DEFAULT_SEVERITIES = ["Critical", "High", "Medium", "Low"];

function formatConditions(rule: NotificationRule): string {
  const parts: string[] = [];
  if (rule.conditions.severity) {
    const { op, label } = rule.conditions.severity;
    parts.push(`severity${op}${label}`);
  }
  if (rule.conditions.service) {
    parts.push(`service=${rule.conditions.service}`);
  }
  return parts.length > 0 ? parts.join(" & ") : "(no condition)";
}

function formatActions(rule: NotificationRule): string {
  return rule.actions.mentions.join(" ");
}

function buildConfigBody(config: IncidentConfig): string {
  const severitiesText =
    config.severities.length > 0
      ? config.severities
          .map(
            (s) => `• ${s.label}${s.description ? ` - ${s.description}` : ""}`,
          )
          .join("\n")
      : "なし";

  const servicesText =
    config.services.length > 0
      ? config.services
          .map(
            (s) => `• ${s.label}${s.description ? ` - ${s.description}` : ""}`,
          )
          .join("\n")
      : "なし";

  const rulesText =
    config.notificationRules.length > 0
      ? config.notificationRules
          .map(
            (r) => `• ${r.name}: ${formatConditions(r)} → ${formatActions(r)}`,
          )
          .join("\n")
      : "なし";

  return `*Severities*\n${severitiesText}\n\n*Services*\n${servicesText}\n\n*Notification Rules*\n${rulesText}`;
}

export function buildConfigMessage({
  result,
  configPath,
}: {
  result: ConfigLoadResult | null;
  configPath: string | undefined;
}): string {
  if (result === null) {
    const defaultList = DEFAULT_SEVERITIES.join(" / ");
    return [
      "📋 *Incident Config* (no config file — using defaults)",
      "",
      `*Severities (default)*`,
      `• ${defaultList}`,
      "",
      "*Services*: なし",
      "",
      "*Notification Rules*: なし",
    ].join("\n");
  }

  if (result.type === "error") {
    return [
      "⚠️ *Incident Config — Load Error*",
      "",
      `Failed to load config from \`${configPath}\`:`,
      result.message,
      "",
      "Please check the file and fix the issue.",
    ].join("\n");
  }

  return [
    `📋 *Incident Config* (loaded from \`${configPath}\`)`,
    "",
    buildConfigBody(result.config),
  ].join("\n");
}
