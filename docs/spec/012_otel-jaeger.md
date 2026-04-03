# OpenTelemetry 計装 + ローカル Jaeger バックエンド

## 要求仕様
- As a 開発者, I want to ローカルで Jaeger UI を開いてトレースを確認したい, so that Slack イベント処理のボトルネックが一目で分かる
- As a 開発者, I want to OTel 計装が OTLP エクスポーター経由で抽象化されている, so that 将来 Datadog 等に繋ぎ直すときにコード変更が不要

## 機能仕様

### 正常系
- `api/src/telemetry.ts` を作成し `api/src/index.ts` の最初に import する
- **Traces**: Slack イベントハンドラーのラッパー関数・全 Firestore repository の各メソッド・Slack API 呼び出しラッパーをスパン化
- **Metrics**: リクエスト数・エラー率（service 層）、Firestore クエリレイテンシ（repository 層）、Slack API 呼び出し時間（ラッパー関数）
- **Logs**: 新規コードは OTel 構造化ログを使用、既存の `console.log/error` は dual-write（console を維持したまま OTel にも送信）
- `docker/compose.yml` に `jaegertracing/all-in-one` を追加（OTLP HTTP: 4318, UI: 16686）
- `OTEL_EXPORTER_OTLP_ENDPOINT` 環境変数で送信先を切り替え可能（デフォルト: `http://localhost:4318`）

### 異常系・エッジケース
- OTel バックエンドへの送信失敗: `DiagConsoleLogger` + SDK 内部のエラー抑制で処理。API 本体への影響なし（アプリコードは try-catch しない）
- `OTEL_EXPORTER_OTLP_ENDPOINT` 未設定: stdout エクスポーターにフォールバック
- `process.env.VITEST` が truthy のとき OTel SDK を初期化しない（既存テストが変わらず通過する）

## 実装方針

### 変更対象コンポーネント

| ファイル | 変更内容 |
|---------|---------|
| `api/src/telemetry.ts`（新規） | OTel SDK 初期化 + `withSpan<T>(name, attrs, fn)` ラッパー関数を export。`process.env.VITEST` が truthy のとき noop |
| `api/src/index.ts` | `telemetry.ts` を先頭で import |
| `api/src/features/incident/incident.repository.ts` | 全メソッドを `withSpan()` でラップ（コレクション名・operation 名を attribute に含む） |
| `api/src/features/member/member.repository.ts` | `upsert` を `withSpan()` でラップ |
| `api/src/slack/handlers/incident-channel.ts` | Slack API 呼び出しラッパー関数内でスパン化・レイテンシ計測。ハンドラー本体はスパンコードを持たない |
| `api/src/features/incident/incident.service.ts` | リクエスト数・エラー率 Metrics を記録 |
| `docker/compose.yml` | Jaeger サービス追加 |

### 技術的アプローチ
- `telemetry.ts` が export する `withSpan<T>(name: string, attrs: Record<string, string>, fn: () => Promise<T>): Promise<T>` を通じて計装。`features/` は `@opentelemetry/api` を直接 import しない
- OTel SDK の無効化条件は `process.env.VITEST`（このプロジェクトの慣習。`NODE_ENV=test` は使わない）
- `@opentelemetry/auto-instrumentations-node` は不採用。HTTP のみ `@opentelemetry/instrumentation-http` を使用、Firestore は手動スパン

### 追加ライブラリ
```
@opentelemetry/sdk-node
@opentelemetry/exporter-trace-otlp-http
@opentelemetry/exporter-metrics-otlp-http
@opentelemetry/api
@opentelemetry/instrumentation-http
```

## 受け入れ条件
- [ ] `docker compose up` 後、`http://localhost:16686` で Jaeger UI が開ける
- [ ] `/inc` コマンドを送信すると Jaeger UI にトレースが表示される
- [ ] 全 Firestore repository の各 CRUD 操作にスパンが作成される（operation 名・コレクション名を attribute として含む）
- [ ] Slack API 呼び出しにスパンが作成される
- [ ] OTel バックエンドが落ちていても API が正常にレスポンスを返し続ける
- [ ] `process.env.VITEST` が truthy のとき OTel SDK が初期化されない（既存テストが変わらず通過する）

## 除外事項
- 本番バックエンド送信設定（Datadog / Grafana Cloud 等）
- カスタムビジネスメトリクス（宣言数・MTTR 等の KPI）
- Grafana / Datadog ダッシュボード構築
- LLM がメトリクスをクエリする基盤（MCP サーバー等）
- `console.log/error` の完全廃止（dual-write のまま残す）
