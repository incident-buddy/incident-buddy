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
