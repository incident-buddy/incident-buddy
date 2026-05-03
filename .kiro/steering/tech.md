# Technology Stack

## Architecture

Clean Architecture / Hexagonal Architecture を採用。`domain/` → `infrastructure/` → `adapter/` の依存方向を維持する。ドメイン層は外部ライブラリに依存しない。

## Core Technologies

- **Language**: TypeScript（ESM、`"type": "module"`）
- **Runtime**: Node.js（mise.toml 管理の LTS）
- **HTTP Framework**: Hono + `@hono/node-server`
- **Slack SDK**: `@slack/bolt` v4（カスタム `HonoReceiver` 経由で Hono に統合）
- **Database**: Firestore（`firebase-admin` v13）
- **Package Manager**: pnpm workspace（root + `api` パッケージ）

## Key Libraries

- **`ulid`**: ID 生成（UUID の代わりにソート可能な ULID を使用）
- **`zod`**: バリデーション・スキーマ定義
- **`@opentelemetry/sdk-node`**: Traces/Metrics の計装（OTel OTLP 形式で Jaeger 等に送信）
- **`@biomejs/biome`**: lint + format（ESLint/Prettier の代替、root レベルで管理）

## Development Standards

### Type Safety
TypeScript strict mode。`as` 型アサーションは禁止（`// iterative construction` 等、やむを得ない箇所のみ許容しコメント必須）。

### Code Quality
Biome で lint/format。`pnpm lint` / `pnpm lint:fix` / `pnpm format`。

### Testing
Vitest + msw（API モック）。`VITEST` 環境変数でテスト検出し OTel SDK 初期化とスパン計装をスキップ。

## Common Commands

```bash
# Dev（api パッケージ）: pnpm -F api dev
# Build: pnpm -F api build  (または mise tasks で確認)
# Test: pnpm -F api test
# Typecheck: pnpm typecheck
# Lint: pnpm lint
# タスク一覧: mise tasks
```

## Key Technical Decisions

### Discriminated-union エラー型
`class extends Error` ではなく plain object のユニオン型でエラーを表現する（`common/errors.ts`）。`instanceof` のクロスモジュール問題を避け、`type` フィールドで網羅的に分岐できる。

```ts
type AppError = SlackApiError | FirestoreError | NotFoundError | ...;
const Errors = {
  slack: (method, slackError): SlackApiError => ({ type: "SlackApiError", ... }),
};
```

### Timestamp↔Date 境界
Firestore の `Timestamp` → `Date` 変換は `lib/firestore.ts` の `toTimestamps`/`fromTimestamps` に集約。ドメイン層は `Date` のみ使用し、`Timestamp` 型はドメイン外に漏出させない。

### HonoReceiver カスタムレシーバー
Bolt のデフォルト HTTP サーバーではなく Hono を使用するため、`adapter/hono-receiver.ts` で Bolt のレシーバーインターフェースを実装して委譲。

### OTel withSpan ヘルパー
```ts
withSpan("incident.repository.store", { collection: "incidents", operation: "store" }, async () => { ... })
```
repository 境界で計装。テスト時は `VITEST` 環境変数で OTel を無効化しオーバーヘッドをゼロにする。

### 環境変数管理
`requireEnv(name)` で必須変数を起動時にクラッシュさせて確認。`optionalEnv(name)` で任意変数を取得（`env.ts`）。
