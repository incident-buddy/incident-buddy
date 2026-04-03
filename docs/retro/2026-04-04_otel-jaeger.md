# レトロスペクティブ議事録: OpenTelemetry 計装 + ローカル Jaeger バックエンド

**日付**: 2026-04-04  
**機能**: otel-jaeger  
**QA判定**: PASS (6/6 受け入れ条件充足)

---

## 起きたこと（Facts）

- Phase 1: テックリードレビューで REQUEST_CHANGES（1回目）
  - HIGH: ハンドラー層スパン化の責務混在 → `withSpan()` をラッパー関数内に閉じ込める方針に修正
  - HIGH: Metrics 記録をハンドラー層に置く設計がアーキテクチャルール違反 → service/repository 層に移動
  - HIGH: `console.log/error` 完全移行リスク → dual-write 方式に縮小
  - HIGH: `NODE_ENV=test` 判定が既存パターン (`process.env.VITEST`) と不整合 → 修正
  - MEDIUM: `@opentelemetry/auto-instrumentations-node` 採用が意図しない自動スパンを生むリスク → 不採用に変更
  - MEDIUM: `features/` への OTel 型漏洩リスク → `withSpan<T>(name, attrs, fn)` ラッパーで完全隔離
- Phase 4.5: テスト設計レビューで REQUEST_CHANGES（1回）
  - HIGH: `withSpan()` spy 検証が欠落 → 全 repository・incident-channel の spy テスト追加
  - HIGH: incident-channel.ts のユニットテスト（`createIncidentChannel` リトライ、`resolveInvitees`、`inviteToChannel`）が欠落 → 追加
  - MEDIUM: `addTimelineEvent` テストの欠落、OTel 障害テストのアサーション欠落 → 追加
  - LOW: `findByChannelId` テストの欠落 → 追加
- Firestore sub-collection の蓄積による `addTimelineEvent` テスト失敗
  - `clearIncidents` は sub-collection を削除しないため、固定ID でテストを繰り返すと蓄積される
  - `beforeEach` で明示的なタイムライン削除を追加して修正
- QA評価: PASS
  - 追加所見: service 層の Metrics 計装と `OTEL_EXPORTER_OTLP_ENDPOINT` 未設定時の stdout フォールバックは受け入れ条件外として未実装のまま PASS

---

## うまくいったこと（Keep）

- `withSpan<T>(name, attrs, fn)` ラッパーによる OTel 型隔離設計は`features/` レイヤーを汚染しない明快な抽象化だった
- `process.env.VITEST` を使った SDK 無効化は既存テストを全く変更せずに計装を導入できた
- テックリードエージェントが OTel 特有の設計リスク（ハンドラー汚染・Metrics 配置・auto-instrumentation 副作用）を的確に指摘した
- docker/compose.yml への Jaeger 追加は影響範囲が小さく確認しやすかった

---

## 問題だったこと（Problem）

- **計2サイクルの REQUEST_CHANGES**: テックリード・テスト設計の両フェーズで修正が発生し、実装開始前の計画精度が不足していた
- **バックログの詳細仕様と受け入れ条件の乖離**: Metrics 計装・stdout フォールバックはバックログに記載があったが、仕様書の受け入れ条件に含まれなかったため未実装で PASS した。仕様書作成時の受け入れ条件の完全性チェックが足りなかった
- **Firestore sub-collection テストパターンの認識不足**: 既存プロジェクトの `clearIncidents` 関数が sub-collection を削除しないことは既知の挙動だが、新規テストで見落とした

---

## 学んだこと（Learn）

- OTel 計装は「どこに span を置くか」「どう型を隔離するか」の判断がアーキテクチャルールと深く絡む。ライブラリ選定（`auto-instrumentations-node` の副作用）や sdk/api の分離など、計装特有の設計パターンをテックリードプロンプトに組み込む価値がある
- BA エージェントがバックログの既存詳細仕様を先読みすれば、仕様書フェーズでの受け入れ条件の完全性を上げられる。「バックログに詳細仕様がある場合はそれを参照して受け入れ条件の漏れを確認する」ステップを BA プロセスに追加すべき

---

## アクションアイテム（Action Items）

| # | 内容 | 対象ファイル | 優先度 | 担当 |
|---|------|------------|-------|------|
| AI-1 | テックリードエージェントに OTel/計装系機能の設計チェックリストを追加 | `.claude/skills/feature-dev/agents/tech-lead.md` | HIGH | LLM |
| AI-2 | business-analyst.md にバックログ先読みステップを追加（詳細仕様がある場合に受け入れ条件の完全性確認） | `.claude/skills/feature-dev/agents/business-analyst.md` | HIGH | LLM |
