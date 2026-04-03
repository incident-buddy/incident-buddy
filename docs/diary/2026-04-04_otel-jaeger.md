# 2026-04-04 OpenTelemetry 計装 + ローカル Jaeger バックエンド 開発活動報告

## サマリー
- **完了した機能**: Node.js API に OTel SDK を導入し Traces・Metrics・Logs の計装基盤を構築。ローカルでは Jaeger UI でトレース可視化。
- **所要フェーズ**: 7 フェーズ完了（レトロ1回・テックリード REQUEST_CHANGES 1回・テスト設計 REQUEST_CHANGES 1回）
- **テスト**: 159 テスト全 PASS（元138 + 追加21テスト）

## 技術的決定事項

### 採用したアプローチ
- `telemetry.ts` が `withSpan<T>(name, attrs, fn)` ラッパーを export し、`features/` は `@opentelemetry/api` に直接触れない設計
- `process.env.VITEST` による SDK 無効化（プロジェクト慣習に合わせ `NODE_ENV=test` は不使用）
- Firestore 操作は auto-instrumentation なし・手動スパン（コレクション名・操作名を attribute に含める）
- Logs は dual-write 方式（console を維持、OTel Logs に同時送信）

### 却下した代替案
- `@opentelemetry/auto-instrumentations-node`: 意図しない自動スパンのノイズ・バンドルサイズ増加リスク
- ハンドラー層での `tracer.startActiveSpan()` 直接使用: アーキテクチャルール（ハンドラーはビジネスロジックを持たない）違反
- `console.log/error` 完全廃止: テスト破壊リスクが高く受け入れ条件にも含まれないため dual-write に縮小

## エージェント・チーム運営の観察

### テックリードエージェント
OTel 特有の設計リスク（ハンドラー汚染・Metrics 配置・`auto-instrumentations` 副作用・型隔離の具体設計）を的確に指摘。計装系機能に特化したレビュー観点をプロンプトに持っておらず 6 件の指摘が出た。→ AI-1 として tech-lead.md に OTel 設計チェックリストを追加済み。

### テスト設計エージェント
`vi.spyOn(telemetry, "withSpan")` による計装検証パターン、`incident-channel.ts` のユニットテスト欠落、`addTimelineEvent` テスト欠落を指摘。Firestore sub-collection の蓄積問題は TDD 実装時に発見されなかった。

### BA エージェント
バックログに詳細仕様があったにもかかわらず、受け入れ条件の完全性（Metrics・stdout フォールバック）を確認しなかった。→ AI-2 として business-analyst.md にバックログ先読みステップを追加済み。

## 学んだこと

### 技術的洞察
- OTel の `@opentelemetry/api` と `@opentelemetry/sdk-node` の分離設計は、アプリコードを SDK に依存させない clean architecture に直結する。ラッパー関数による型隔離がこの分離を実現する最小のコスト。
- Firestore sub-collection は親ドキュメントを削除しても消えない。固定 ID でテストを繰り返す場合は `beforeEach` でサブコレクションのクリーンアップが必要。
- `vi.spyOn(module, "exportedFn")` でラッパー関数の呼び出し引数を検証するパターンは、OTel スパン名・属性の意図的な設計を担保する軽量なアプローチ。

### プロセス改善の示唆
- バックログに機能仕様・受け入れ条件がある場合は BA エージェントがそれを先読みして仕様書の完全性を確認すべき（AI-2 で対応）
- 計装系機能はテックリードの標準チェックリストでカバーされにくい観点を持つため、専用チェックリストが有効（AI-1 で対応）

## 次のアクション（あれば）
- `incident.service.ts` への Metrics 計装（リクエスト数・エラー率）: 仕様書に記載あり、次回以降の改善候補
- `OTEL_EXPORTER_OTLP_ENDPOINT` 未設定時の stdout エクスポーターフォールバック: 仕様書の異常系仕様として記録済み
