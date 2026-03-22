import * as fs from "node:fs";
import type {
  ConfigLoadResult,
  IncidentConfig,
  NotificationRule,
  SeverityCondition,
} from "./incident-config.model.js";
import { parseIncidentConfig } from "./incident-config.parser.js";

/**
 * インシデントの severity が通知条件の severity 条件を満たすか判定する
 *
 * @description `severities` 配列のインデックスで重要度を表現する（先頭 = 最重要）。
 * `>= High` は「High 以上（= インデックスが High 以下）」を意味する。
 * @param severities - 設定ファイルで定義された severity 一覧（重要度順）
 * @param incidentSeverity - 判定対象インシデントの severity ラベル
 * @param condition - 通知ルールの severity 条件
 * @returns 条件を満たす場合 `true`
 */
function compareSeverity({
  severities,
  incidentSeverity,
  condition,
}: {
  severities: IncidentConfig["severities"];
  incidentSeverity: string;
  condition: SeverityCondition;
}): boolean {
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

/**
 * インシデントの severity とサービス名に一致する通知ルールを返す
 *
 * @description 各ルールの `conditions.severity` / `conditions.service` を評価し、
 * どちらの条件も満たすルールのみを返す。条件が省略されたフィールドはワイルドカード扱い。
 * @param config - 設定ファイルから読み込んだ設定オブジェクト
 * @param severity - インシデントの severity ラベル
 * @param serviceName - インシデントのサービス名
 * @returns 条件に一致した通知ルールの配列
 */
export function matchRules({
  config,
  severity,
  serviceName,
}: {
  config: IncidentConfig;
  severity: string;
  serviceName: string;
}): NotificationRule[] {
  return config.notificationRules.filter((rule) => {
    const { severity: sevCond, service: svcCond } = rule.conditions;

    if (sevCond !== undefined) {
      if (
        !compareSeverity({
          severities: config.severities,
          incidentSeverity: severity,
          condition: sevCond,
        })
      )
        return false;
    }

    if (svcCond !== undefined) {
      if (!serviceName) return false;
      if (serviceName.toLowerCase() !== svcCond.toLowerCase()) return false;
    }

    return true;
  });
}

const KNOWN_SECTIONS = /^## (Severities|Services|Notification Rules|Roles)/im;

/**
 * 指定パスの設定ファイルを読み込み、パースして返す
 *
 * @description ファイルの読み込み・パースに失敗した場合、またはファイルに認識可能な
 * セクション（`## Severities` 等）が存在しない場合は `type: "error"` を返す。
 * エラーを throw しないため、呼び出し側は戻り値の `type` を確認すること。
 * @param filePath - 設定ファイルの絶対パスまたは相対パス
 * @returns `ConfigLoadResult` — 成功時は `{ type: "ok", config }`, 失敗時は `{ type: "error", message }`
 */
export async function loadConfig(filePath: string): Promise<ConfigLoadResult> {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    if (content.trim().length > 0 && !KNOWN_SECTIONS.test(content)) {
      return {
        type: "error",
        message:
          "No recognizable sections found (expected ## Severities, ## Services, or ## Notification Rules)",
      };
    }
    return { type: "ok", config: parseIncidentConfig(content) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { type: "error", message };
  }
}
