---
name: feature-dev
description: This skill should be used when the user invokes "/feature-dev", asks to "start feature development", "develop a new feature", "implement a feature with full workflow", or provides a feature requirement to be developed through the LLM-driven development workflow (Plan → Spec → E2E → TDD → Test Review → Acceptance → Diary).
---

# feature-dev: LLM駆動開発フルワークフロー

機能要求をユーザーのメッセージから取得する。

LLM駆動開発のオーケストレーターとして以下のフェーズを順番に実行する。各フェーズに進む前に、前のフェーズが完了していることを確認すること。

## 起動時の準備

`TaskCreate` で以下のタスクを作成し、フェーズ進行を可視化する：
- Phase 1: Plan（計画立案）
- Phase 2: Spec（仕様書作成）
- Phase 3: E2E Test（失敗確認）
- Phase 4: TDD実装
- Phase 4.5: Test Design Review
- Phase 5: Acceptance Testing（QAゲート）
- Phase 6: Retrospective
- Phase 7: Activity Report

---

## Phase 1: Plan（計画立案）

**目的**: ビジネスアナリストエージェントがユーザーと対話しながら要求を精緻化し、実装方針を明確化する。コードは一切書かない。

1. `.claude/skills/feature-dev/agents/business-analyst.md` を Read してsystem promptを取得し、**ビジネスアナリストエージェント** を起動して機能要求を精緻化させる：
   - prompt: `"以下の機能要求についてヒアリングを実施し、要求サマリーを作成してください。\n\n機能要求: {機能要求}"`

2. BAエージェントが出力した **要求サマリー** をもとに、オーケストレーターが実装方針（変更対象コンポーネント・技術的アプローチ）を追加して計画サマリーを完成させる。

3. `.claude/skills/feature-dev/agents/tech-lead.md` を Read してpromptテンプレートを取得し、**テックリードエージェント** を起動して実装方針をレビューさせる：
   - promptの `{計画サマリー（要求仕様・機能仕様・実装方針・受け入れ条件）}` に計画サマリーを埋め込む
   - **APPROVE**: 次のステップへ
   - **REQUEST_CHANGES**: 指摘事項を反映して計画を修正し、再度起動する（最大2回）

4. テックリードレビューの指摘事項（重要度 HIGH / MEDIUM）を `docs/design-rules.md` に追記する。
   - 既存の該当セクション（アーキテクチャ / テスト / エラーハンドリング / 型設計 / その他）に分類して追加する
   - APPROVE でコメントのみの場合も、汎用的なガイドラインとして記録する価値があれば追記する
   - フォーマット: `- [{yyyy-mm-dd} {feature-slug}] {指摘内容}`

5. `AskUserQuestion` でユーザー承認を得る。承認後 `TaskUpdate` で Phase 1 を complete にする。

---

## Phase 2: Spec（仕様書作成）

**目的**: Phase 1 の合意内容を仕様書として永続化する。

1. `docs/spec/` に仕様書を作成する。
   - ファイル名: `NNN_{feature-slug}.md`（例: `001_incident-severity-filter.md`）
   - feature-slug は機能説明から英語のkebab-caseで生成する
   - フォーマットは `.claude/skills/feature-dev/references/spec-template.md` を参照する

2. `AskUserQuestion` で確認後、`TaskUpdate` で Phase 2 を complete にする。

---

## Phase 3: E2E Test（失敗確認）

**目的**: 仕様の受け入れ条件を網羅するE2Eテストを実装し、現時点でfailすることを確認する。

1. 仕様書の受け入れ条件をすべてカバーするE2Eテストを実装する。
   - 既存のテスト構成（Vitest + MSW + Firestore emulator）に従う
   - テストファイルは `api/src/**/*.e2e.test.ts` または `api/src/e2e/` に配置

2. devcontainer内でテストを実行する（**ホストで直接実行禁止**）：
   - 実行前に `devcontainer exec --workspace-folder . bash -c 'mise tasks'` で利用可能タスクを確認する
   - 例: `devcontainer exec --workspace-folder . bash -c 'mise run test:e2e'`

3. **テストがfailすることを確認する**。
   - passした場合: テストが仕様を正しくカバーできていないとして仕様書に立ち返り修正する
   - failした場合: `TaskUpdate` で Phase 3 を complete にして Phase 4 へ

---

## Phase 4: TDD実装（Red → Green → Refactor）

**目的**: ユニットテストで駆動しながら最小限の実装を積み上げ、E2EテストをpassさせるまでPhase 3-4サイクルを回す。

サイクル: **Red**（テスト作成・fail確認）→ **Green**（最小実装）→ **Refactor**（重複除去・可読性改善）

ルール:
- 1サイクルは1関数・1メソッドレベルに保つ
- Refactor前にテストがgreenであることを確認する
- 実装コードよりテストを先に書く

### 完了条件

Phase 3 のE2Eテストがdevcontainer内でpassすること（`devcontainer exec --workspace-folder . bash -c 'mise run test:e2e'`）。

### アーキテクチャ適合チェック（E2E Green後・必須）

以下の違反パターンを機械的に確認する：

| チェック項目 | コマンド |
|------------|--------|
| `slack/handlers/` からの repository 直接参照 | `grep -r "Repository" api/src/slack/` |
| `features/` での Timestamp 型使用 | `grep -r "Timestamp" api/src/features/` |
| `features/` での `@slack/bolt` 型インポート | `grep -r "@slack/bolt" api/src/features/` |
| `as` 型アサーションの使用 | `grep -rn " as " api/src/` |

違反が見つかった場合はその場で修正する。完了後 `TaskUpdate` で Phase 4 を complete にする。

---

## Phase 4.5: Test Design Review

**目的**: 実装に対して必要なユニットテストが揃っているかを静的にレビューし、弱いアサーションや抜け漏れを Phase 5 前に検出する。

`.claude/skills/feature-dev/agents/test-engineer.md` を Read してpromptを取得し、**テスト設計＆検証エージェント** を起動する：
- promptの `{feature-slug}` に実際のslugを埋め込む

- **APPROVE**: `TaskUpdate` で Phase 4.5 を complete にして Phase 5 へ
- **REQUEST_CHANGES**: 指摘事項を修正し、全テスト green を確認してから再度起動する（最大2回）

---

## Phase 5: Acceptance Testing（QAゲート）

**目的**: 受け入れテスト担当エージェントが仕様書に照らしてQA評価を行う。

`.claude/skills/feature-dev/agents/acceptance-tester.md` を Read してsystem promptを取得し、**受け入れテスト担当エージェント** を起動する：
- prompt: `"受け入れテストを実施してください。\n\n仕様書パス: docs/spec/{feature-slug}.md\nE2Eテスト結果: {e2e_test_results}"`

QA評価完了後、**PASS・FAIL にかかわらず必ず Phase 6（Retrospective）を実施すること。Phase 7 へ直接進んではならない。**

`TaskUpdate` で Phase 5 を complete にする。

---

## Phase 6: Retrospective

**目的**: 成功と失敗から学び、アクションアイテムを特定する。

`.claude/skills/feature-dev/agents/scrum-master.md` を Read してsystem promptを取得し、**スクラムマスターエージェント** を起動する：
- prompt: `"開発ワークフローが完了しました。QA判定: {PASS or FAIL}。テスト結果と仕様書の内容をもとにレトロスペクティブを実施してください。\n\n仕様書パス: docs/spec/{feature-slug}.md\nQA評価結果: {qa_evaluation_report}\n利用したskillのパス: .claude/skills/feature-dev/SKILL.md"`

レトロ完了後、アクションアイテムをユーザーに報告する。ユーザーの承認後、アクションアイテムを実行する。`TaskUpdate` で Phase 6 を complete にする。

---

## Phase 7: Activity Report（完了）

**目的**: エンジニアリングマネージャーの視点で開発活動を振り返り、組織学習として記録する。

1. `docs/diary/{yyyy-mm-dd}_{feature-slug}.md` に活動日誌を作成する。フォーマットは `.claude/skills/feature-dev/references/diary-template.md` を参照する。

2. 変更をコミットする（適切な粒度で）。

3. ドキュメントを更新する：
   - READMEに実装機能を追記
   - `docs/backlog.md` から実装済み機能を削除（**specファイルは削除しないこと**）

4. `.claude/skills/feature-dev/agents/quiz-generator.md` を Read してpromptを取得し、**アーキテクチャクイズ生成エージェント** を起動する：
   - promptの `{feature-slug}` に実際のslugを埋め込む
   - エージェントは仕様書と実装を精読し、`docs/architecture-quiz.md` に新しいセクションを追記する

5. `TaskUpdate` で Phase 7 を complete にする。

6. 完了を報告する：
   > 「開発ワークフローが完了しました。\n\n- 仕様書: `docs/spec/{feature-slug}.md`\n- 活動日誌: `docs/diary/{yyyy-mm-dd}_{feature-slug}.md`\n- クイズ: `docs/architecture-quiz.md`\n\nレトロスペクティブは `docs/retro/` に議事録があります。」

---

## 重要なルール

- **devcontainer必須**: コマンドはホストで直接実行禁止。`devcontainer exec --workspace-folder . bash -c '...'` を使う
- **miseタスク優先**: 実行前に `mise tasks` でタスクを確認し、対応するmiseタスクがあればそれを使う
- **Phase飛ばし禁止**: 各Phaseはユーザーの承認または明示的な完了確認を経てから次へ進む
- **コードはPhase 3以降**: Phase 1・2ではコードを書かない
- **小さいサイクル**: TDDの各サイクルは1関数・1メソッドレベルに保つ

## エージェントファイル一覧

| エージェント | ファイル |
|------------|--------|
| ビジネスアナリスト | `.claude/skills/feature-dev/agents/business-analyst.md` |
| テックリード | `.claude/skills/feature-dev/agents/tech-lead.md` |
| テストエンジニア | `.claude/skills/feature-dev/agents/test-engineer.md` |
| 受け入れテスト担当 | `.claude/skills/feature-dev/agents/acceptance-tester.md` |
| スクラムマスター | `.claude/skills/feature-dev/agents/scrum-master.md` |
| アーキテクチャクイズ生成 | `.claude/skills/feature-dev/agents/quiz-generator.md` |

## テンプレートファイル一覧

| 用途 | ファイル |
|-----|--------|
| 仕様書フォーマット | `.claude/skills/feature-dev/references/spec-template.md` |
| 活動日誌フォーマット | `.claude/skills/feature-dev/references/diary-template.md` |
