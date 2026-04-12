import * as fs from "node:fs/promises";
import { ResultAsync, ok, err } from "neverthrow";
import type { AppError } from "./app-error.js";
import { requireEnv } from "./env.js";

const CONFIG_PATH = requireEnv("INCIDENT_CONFIG_PATH");
const KNOWN_SECTIONS = /^## (Severities|Services|Notification Rules|Roles)/im;

/** 設定ファイルの `## Severities` セクションで定義された severity エントリ */
export type SeverityDef = {
  /** severity ラベル（例: `"Critical"`, `"High"`）。ファイル先頭が最重要 */
  label: string;
  description: string;
};

/** 設定ファイルの `## Services` セクションで定義されたサービスエントリ */
export type ServiceDef = {
  /** サービスラベル（例: `"API"`, `"Auth"`） */
  label: string;
  description: string;
};

/**
 * 通知ルールの severity 条件
 *
 * @example
 * `>= High` → `{ op: ">=", label: "High" }`（High 以上の severity に一致）
 */
export type SeverityCondition = {
  /** 比較演算子。`>=` / `<=` はファイル順のインデックスで比較する */
  op: "==" | ">=" | "<=";
  label: string;
};

/** 設定ファイルの `## Notification Rules` セクションで定義された通知ルール */
export type NotificationRule = {
  /** ルール名（`### Rule Name` の見出しテキスト） */
  name: string;
  conditions: {
    /** severity 条件（省略時は全 severity に一致） */
    severity?: SeverityCondition;
    /** サービス名の完全一致条件（省略時は全サービスに一致） */
    service?: string;
  };
  actions: {
    /** ルールにマッチしたときに招待・メンションする対象（例: `"@here"`, `"@UXXXXXXX"`） */
    mentions: string[];
  };
};

/** 設定ファイルの `## Roles` セクションで定義されたロール */
export type RoleDef = {
  /** ロール ID（`### role-id` の見出しテキスト） */
  id: string;
  /** 表示ラベル（description 先頭の「。」前のテキストから抽出） */
  label: string;
  description: string;
};

/** 設定ファイルのパース済み全設定 */
export type IncidentConfig = {
  severities: SeverityDef[];
  services: ServiceDef[];
  notificationRules: NotificationRule[];
  roles: RoleDef[];
};

/**
 * `loadConfig` の戻り値
 *
 * - `ok` — 設定の読み込み・パースに成功
 * - `error` — ファイルが読めない、または認識可能なセクションが存在しない
 */
export type ConfigLoadResult =
  | { type: "ok"; config: IncidentConfig }
  | { type: "error"; message: string };


type Section =
  | "severities"
  | "services"
  | "notification-rules"
  | "roles"
  | null;

/**
 * 設定ファイルを読み込み、パースして返す
 *
 * @returns `ConfigLoadResult` — 成功時は `{ type: "ok", config }`, 失敗時は `{ type: "error", message }`
 */
export function loadConfig(): ResultAsync<IncidentConfig, AppError> {
	return ResultAsync
		.fromPromise(fs.readFile(CONFIG_PATH, "utf8"), (err) => ({err}))
		.andThen((conf: string) => {
			if (conf.trim().length > 0 && !KNOWN_SECTIONS.test(conf)) {
				return err({ err: `invalid conf: ${conf}` });
			} else return ok(conf)
		})
		.map(parseIncidentConfig)
}

/**
 * `severity` フィールドの値文字列を `SeverityCondition` にパースする
 *
 * @param value - 例: `">= High"`, `"<= Low"`, `"Critical"`
 * @returns パース済みの `SeverityCondition`
 */
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

/**
 * Markdown 形式の設定ファイルのテキストをパースして `IncidentConfig` を返す
 *
 * @description `## Severities` / `## Services` / `## Notification Rules` / `## Roles`
 * の H2 見出しをセクション区切りとして認識し、H3 (`###`) をエントリ、
 * `- key: value` 形式のリストを通知ルールのフィールドとして解釈する。
 * 認識できないセクションは無視される。
 * @param content - 設定ファイルの全テキスト（`fs.readFileSync` の戻り値など）
 * @returns パース済みの `IncidentConfig`
 */
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
          actions: { mentions: [] },
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
      (currentSection === "severities" ||
        currentSection === "services" ||
        currentSection === "roles")
    ) {
      currentDescLines.push(line.trim());
    }
  }

  flushEntry();
  flushRule();

  return { severities, services, notificationRules, roles };
}
