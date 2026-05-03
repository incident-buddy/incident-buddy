# Project Structure

## Organization Philosophy

Clean Architecture / Hexagonal Architecture。依存方向は常に外側 → 内側（`adapter` → `infrastructure` → `domain`）。`domain/` はフレームワーク・外部ライブラリに依存しない純粋な型・インターフェース定義のみ。

## Directory Patterns

### domain/
**Location**: `api/src/domain/{feature}/`
**Purpose**: ドメイン型定義（`*.model.ts`）とリポジトリインターフェース（`*.repository.ts`）。外部ライブラリに依存しない（例: Firestoreの `Timestamp` は使用せず、`Date` を使用）。

```ts
// domain/incident/incident.model.ts
export type Incident = { id: string; createdAt: Date; ... };
export interface IncidentRepository {
  resolve(id: string): PromiseLike<Incident | undefined>;
  store(incident: Incident): PromiseLike<void>;
}
```

### infrastructure/
**Location**: `api/src/infrastructure/{feature}/`
**Purpose**: リポジトリの Firestore 実装。`toTimestamps`/`fromTimestamps` で Timestamp↔Date 変換を閉じ込める。`withSpan` で OTel 計装。

```ts
// infrastructure/incident/incident.repository.ts
export const incidentRepository: IncidentRepository = {
  store(incident) {
    return withSpan("incident.repository.store", { collection: "incidents" }, async () => {
      await incidentsCol.doc(incident.id).set(toTimestamps(incident));
    });
  },
};
```

### adapter/
**Location**: `api/src/adapter/`
**Purpose**: Slack Bolt ↔ Hono ブリッジ（`hono-receiver.ts`）と Slack イベントハンドラ登録（`slack-handler.ts`）。`ack()` 呼び出しと service 呼び出しのみ。ビジネスロジックを書かない。

### lib/
**Location**: `api/src/lib/`
**Purpose**: インフラ横断の共有ユーティリティ。`firestore.ts`（Singleton + 型変換）、`telemetry.ts`（OTel SDK + `withSpan`）、`slack-client.ts`。

### features/
**Location**: `api/src/features/{feature}/`
**Purpose**: ドメインに閉じない機能実装（例: config パーサー）。`config.parser.ts` は Markdown 設定ファイルを `IncidentConfig` 型に変換する純粋関数。

### common/
**Location**: `api/src/common/`
**Purpose**: アプリ全体で共有されるユーティリティ。`errors.ts`（discriminated-union エラー型）、`id.ts`（ULID 生成）。

## Naming Conventions

- **Files**: `{feature}.{role}.ts`（例: `incident.model.ts`, `incident.repository.ts`）
- **Repository instances**: camelCase の const export（例: `export const incidentRepository: IncidentRepository = ...`）
- **Error factory**: `Errors.{type}()` ファクトリ関数（例: `Errors.slack(method, error)`）
- **Span names**: `"{feature}.{layer}.{operation}"`（例: `"incident.repository.store"`）

## Import Organization

`@src/` パスエイリアスで `api/src/` からの絶対インポートを使用。

```ts
import type { Incident } from "@src/domain/incident/incident.model";
import { withSpan } from "@src/lib/telemetry";
import { db, toTimestamps } from "@src/lib/firestore";
```

## Code Organization Principles

1. **ドメイン純粋性**: `domain/` には外部ライブラリの型や定数を持ち込まない。たとえば、 Firestoreの`Timestamp`・`@slack/bolt` 型は持ち込まない
2. **エラー表現**: `throw new Error` ではなく `Errors.*` で discriminated-union を返す。Slack API の `ok: false` は明示チェック
3. **ID**: ULID（`common/id.ts`）。UUID は使わない
4. **テスト検出**: `process.env.VITEST` で OTel と Slack サーバー起動をスキップ
5. **環境変数**: `requireEnv` / `optionalEnv` 経由のみ。`process.env.X` を直接参照しない
