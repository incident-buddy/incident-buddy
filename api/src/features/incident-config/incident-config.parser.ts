import type {
  IncidentConfig,
  NotificationRule,
  RoleDef,
  ServiceDef,
  SeverityCondition,
  SeverityDef,
} from "./incident-config.model.js";

type Section = "severities" | "services" | "notification-rules" | "roles" | null;

function parseSeverityCondition(value: string): SeverityCondition {
  const trimmed = value.trim();
  if (trimmed.startsWith(">=")) {
    return { op: ">=", label: trimmed.slice(2).trim() };
  }
  if (trimmed.startsWith("<=")) {
    return { op: "<=", label: trimmed.slice(2).trim() };
  }
  return { op: "==", label: trimmed };
}

export function parseIncidentConfig(content: string): IncidentConfig {
  const lines = content.split("\n");

  const severities: SeverityDef[] = [];
  const services: ServiceDef[] = [];
  const notificationRules: NotificationRule[] = [];
  const roles: RoleDef[] = [];

  let currentSection: Section = null;
  let currentEntryLabel: string | null = null;
  let currentDescLines: string[] = [];

  function flushEntry() {
    if (currentEntryLabel === null) return;
    const description = currentDescLines.join("\n").trim();

    if (currentSection === "severities") {
      severities.push({ label: currentEntryLabel, description });
    } else if (currentSection === "services") {
      services.push({ label: currentEntryLabel, description });
    } else if (currentSection === "roles") {
      // label は description の最初の「。」前のテキスト、なければ id をそのまま使う
      const labelMatch = description.match(/^([^。]+)/);
      const label = labelMatch?.[1]?.trim() ?? currentEntryLabel;
      roles.push({ id: currentEntryLabel, label, description });
    }
    // notification-rules entries are flushed via flushRule
    currentEntryLabel = null;
    currentDescLines = [];
  }

  // Current rule being built
  let currentRule: NotificationRule | null = null;

  function flushRule() {
    if (currentRule) {
      notificationRules.push(currentRule);
      currentRule = null;
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // H1 - skip
    if (line.startsWith("# ") && !line.startsWith("## ")) {
      continue;
    }

    // H2 - section switch
    if (line.startsWith("## ")) {
      flushEntry();
      flushRule();
      const sectionName = line.slice(3).trim().toLowerCase();
      if (sectionName === "severities") {
        currentSection = "severities";
      } else if (sectionName === "services") {
        currentSection = "services";
      } else if (sectionName === "notification rules") {
        currentSection = "notification-rules";
      } else if (sectionName === "roles") {
        currentSection = "roles";
      } else {
        currentSection = null;
      }
      continue;
    }

    // H3 - entry start
    if (line.startsWith("### ")) {
      flushEntry();
      flushRule();
      const label = line.slice(4).trim();
      currentEntryLabel = label;
      currentDescLines = [];
      if (currentSection === "notification-rules") {
        currentRule = {
          name: label,
          conditions: {},
          actions: { channels: [], mentions: [] },
        };
      }
      continue;
    }

    // List item - key: value
    if (
      line.startsWith("- ") &&
      currentSection === "notification-rules" &&
      currentRule
    ) {
      const item = line.slice(2).trim();
      const colonIdx = item.indexOf(":");
      if (colonIdx === -1) continue;
      const key = item.slice(0, colonIdx).trim();
      const value = item.slice(colonIdx + 1).trim();

      if (key === "severity") {
        currentRule.conditions.severity = parseSeverityCondition(value);
      } else if (key === "service") {
        currentRule.conditions.service = value;
      } else if (key === "channel") {
        currentRule.actions.channels.push(value);
      } else if (key === "mention") {
        const mentions = value.split(/\s+/).filter(Boolean);
        currentRule.actions.mentions.push(...mentions);
      }
      continue;
    }

    // Description line (non-empty, non-heading, non-list)
    if (
      line.trim() !== "" &&
      !line.startsWith("#") &&
      !line.startsWith("- ") &&
      currentEntryLabel !== null &&
      (currentSection === "severities" || currentSection === "services" || currentSection === "roles")
    ) {
      currentDescLines.push(line.trim());
    }
  }

  flushEntry();
  flushRule();

  return { severities, services, notificationRules, roles };
}
