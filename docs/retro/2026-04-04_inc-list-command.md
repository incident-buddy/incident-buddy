# レトロスペクティブ議事録

**日付**: 2026-04-04
**機能**: `/inc list` コマンド（オープン中インシデント一覧表示）
**QA判定**: FAIL → 修正後 PASS

---

## 起きたこと（Facts）

| Phase | 内容 | 結果 |
|-------|------|------|
| Phase 1 | 計画立案（BA + テックリードレビュー 2回） | REQUEST_CHANGES × 1 → APPROVE |
| Phase 2 | 仕様書作成 | `docs/spec/011_inc-list-command.md` |
| Phase 3 | E2Eテスト実装（5件） | fail 確認 |
| Phase 4 | TDD実装 + repository リファクタリング | 133テスト pass |
| Phase 5 | 受け入れテスト（QAゲート） | FAIL → 修正後 PASS（7/7充足） |

**テックリードレビュー 1回目 REQUEST_CHANGES の理由**
- `findOpen()` に `.limit()` が欠如（Firestore全件読み込みリスク）
- エラーハンドリング方針が不明確（`respond()` vs `postError()` の判断基準なし）

**QA FAIL の理由**
- `expect(getText()).toBeTruthy()` という弱いアサーション
- エラーメッセージ内容を検証していなかった（`toContain("インシデント一覧の取得に失敗しました")` が正しい）

**context compaction 後の失敗コマンド**
- `mise run dc:shell -- bash -c "..."` が失敗
- `dc:shell` タスクは `devcontainer exec --workspace-folder . bash`（対話シェル専用）で、引数の継ぎ足しは `bash bash -c ...` になってしまう
- 正しいパターン: `devcontainer exec --workspace-folder . bash -c '...'`

**Phase 4 と同時に実施したリファクタリング**
- repository の domain-verb メソッド（`addResponder`, `resolve`）削除 → generic `update(id, patch)` パターンへ統一
- `IncidentPatch` 型の導入（Firestore 変換の封じ込め）

---

## うまくいったこと（Keep）

- `buildIncidentListMessage(incidents, now: Date)` を純粋関数として設計し、ユニットテストが容易だった
- TDD サイクルが小さく保たれ、実装の見通しが良かった
- テックリードレビューが2回で承認（前回は3回必要だった）
- E2Eテストが MSW + Firestore emulator で実際の HTTP リクエストを検証できた

---

## 問題だったこと（Problem）

- QA FAIL: `toBeTruthy()` の弱いアサーションが Phase 4 完了時点で検出できなかった
- context compaction 後に devcontainer コマンドパターンを忘れ、失敗コマンドを実行した
- Phase 4 でリファクタリングと機能実装を同時に進めたことでスコープが広がった（結果的には良かったが）

---

## 学んだこと（Learn）

- **テスト設計のシフトレフト**: `toBeTruthy()` のような弱いアサーションは QA ゲートより前のフェーズで検出すべき → Phase 4.5（テスト設計＆検証エージェント）を導入
- **context compaction のリスク**: LLM がプロジェクト固有のコマンドパターンを「忘れる」ことがある。CLAUDE.md への明記が有効な対策
- **respond() の使い所**: Slack の `respond()` は `response_url` ベースのためボットのチャンネル参加不要。ephemeral エラー表示に適している

---

## アクションアイテム（Action Items）

| # | 内容 | 担当 | 優先度 | ステータス |
|---|------|------|--------|------------|
| 1 | CLAUDE.md に devcontainer 正しいコマンドパターンを明記 | AI | HIGH | 完了（本レトロ中に実施） |
| 2 | feature-dev.md に Phase 4.5（テスト設計＆検証エージェント）を追加 | AI | HIGH | 完了（本レトロ中に実施） |
