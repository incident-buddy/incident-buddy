# 2026-04-04 /inc list コマンド 開発活動報告

## サマリー

- **完了した機能**: `/inc list` コマンド — オープン中インシデントをユーザーに ephemeral 表示する
- **所要フェーズ**: Plan（テックリード2回レビュー） → Spec → E2E(fail) → TDD → QA FAIL → 修正 → QA PASS → Retro → Diary
- **全テスト数**: 133 tests passed

## 技術的決定事項

### 選択したアプローチ

1. **`buildIncidentListMessage(incidents, now: Date)` を純粋関数として設計**
   - 現在時刻を引数で受け取ることで、ユニットテストが副作用なしに書ける
   - E2E に頼らずプレゼンターロジックをユニットで完全検証できる

2. **エラー表示に `respond()` を使用（`postError()` ではない）**
   - `respond()` は `response_url` ベースのためボットのチャンネル参加不要
   - `/inc list` は slash command のため、チャンネル参加なしで ephemeral を返せる

3. **`findOpen(limit = 10)` に `.limit()` を追加**
   - Firestore の全件読み込みを防ぐためクエリレベルで制限

### 却下した代替案

- repository に `findOpenList()` を追加するのではなく、既存の `findOpen()` にデフォルト引数 `limit` を追加（破壊的変更なし）

## Phase 4 で同時実施したリファクタリング

repository の domain-verb メソッド（`addResponder`, `resolve`）を削除し、generic `update(id, patch)` パターンへ統一。`IncidentPatch` 型を導入し、Firestore の `FieldValue.arrayUnion` / `arrayRemove` / `Timestamp.fromDate` の変換を repository 内に封じ込めた。

## エージェント・チーム運営の観察

- **BA エージェント**: ヒアリングで「降順表示」「resolved除外」などのエッジケースを引き出せた
- **テックリードエージェント**: 1回目で `.limit()` の欠如を正確に指摘。2回目は APPROVE
- **QA エージェント**: `toBeTruthy()` の弱いアサーションを検出（FAIL）。修正後は 7/7 全条件を充足
- **スクラムマスターエージェント**: context compaction 後の失敗コマンドをレトロの観察事項として記録
- **フィードバックループの健全性**: QA FAIL が発生したが、修正範囲が1行（アサーション変更）だったため素早く対処できた

## 学んだこと

### 技術的洞察

- Slack の `respond()` と `chat.postMessage()` の使い分け: slash command の ephemeral には `respond()` が適切
- `FieldValue.arrayUnion` / `arrayRemove` を repository に閉じ込めることで、service 層が Firestore 型に依存しなくなる

### プロセス改善の示唆

- **Phase 4.5 の導入**: テスト設計レビューを QA 前に行うことで、弱いアサーションを早期検出できる
- **context compaction 対策**: CLAUDE.md に devcontainer コマンドの正しいパターンを明記することで、compaction 後の失敗コマンドを防ぐ

## 次のアクション

- バックログの残課題: 重大度変更（I）、チャンネルトピック自動設定（L）、メモ追記（G）
