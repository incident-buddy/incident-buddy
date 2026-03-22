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

/**
 * `/incident config` コマンドの応答メッセージを構築する
 *
 * @description `result` の状態に応じて 3 パターンのメッセージを返す:
 * - `null` — 設定ファイル未指定。デフォルト severity 一覧を表示
 * - `{ type: "error" }` — 読み込み失敗。エラー内容とファイルパスを表示
 * - `{ type: "ok" }` — 読み込み成功。severity / services / notification rules を表示
 * @param result - `loadConfig` の戻り値、または設定ファイルが未指定の場合 `null`
 * @param configPath - 設定ファイルのパス（エラーメッセージ表示用）
 * @returns Slack に投稿するメッセージ文字列（mrkdwn 形式）
 */
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
