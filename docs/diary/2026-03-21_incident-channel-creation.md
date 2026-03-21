# 2026-03-21 インシデントチャンネル自動作成・招待 開発活動報告

## サマリー

- **完了した機能**: インシデント宣言時に `inc-YYYYMMDD-NNN` 形式のパブリックチャンネルを自動作成し、通知ルールのメンション対象ユーザーを招待。通知メッセージにはチャンネルリンクを追記。
- **所要フェーズ数**: レトロスペクティブ 0 回、受け入れテスト 4 回 FAIL → PASS
- **最終テスト**: 75 件 ALL PASS

## 技術的決定事項

### 選択したアプローチとその理由

1. **Slack API ロジックを `slack/handlers/incident-channel.ts` に集約**
   - チャンネル作成・招待ロジックは Slack API 依存が強いため `slack/handlers/` 内に閉じ込め、`features/` 層に Slack SDK 依存を持ち込まない
   - アーキテクチャルールに従い `features/` はドメインロジック専業を維持

2. **`buildChannelName` を純粋関数として切り出し**
   - 日付と連番から文字列を生成するだけのロジックをユニットテスト可能な純粋関数として分離
   - 副作用のある `createIncidentChannel` とは独立してテスト可能

3. **`inviteToChannel` に内部 try-catch + `ok: false` 明示チェックを持たせる**
   - Slack SDK は `ok: false` を throw するが、防御的に戻り値の `ok` も明示チェック
   - 「失敗はログのみ（処理を継続）」という責務を関数内部で自己完結させることで呼び出し元をシンプルに保つ

4. **`buildIncidentMessage` にオプション引数 `incidentChannelId` を追加**
   - 既存の呼び出し元を壊さないよう `options?: { incidentChannelId?: string }` でオプション化
   - チャンネルリンクを `text` フィールドに追記してアクセス性を確保

5. **`respond()` を使った `/inc config` の ephemeral 応答**
   - 前フェーズ（respond()への切り替え）で `chat.postEphemeral` を `respond()` に変更
   - `respond()` は Slack の `response_url` を使うためボットのチャンネル参加不要
   - テストには `response_url` をモック payload に追加し、対応する MSW ハンドラーを追加

### 却下した代替案

- **`features/incident-channel/` を新設**: チャンネル作成・招待は Slack API 依存が強く、Firestore モデルもないため feature 層に置く必要性がなかった
- **チャンネル ID を Firestore に保存**: MVP スコープとして除外（仕様書の除外事項に明記）

## エージェント・チーム運営の観察

### 受け入れテストエージェントのフィードバックループ（4回）

**FAIL 1回目**: `inviteToChannel` のコメントと実装の責務分離の乖離、チャンネル作成失敗テストの堅牢性不足
→ 対応: `inviteToChannel` を自己完結型に変更、inviteSpy アサーション追加、50ms wait追加

**FAIL 2回目**: 招待失敗テストの `console.error` アサーションが具体的でない（どの理由で呼ばれたか不明）
→ 対応: `toHaveBeenCalledWith(expect.stringContaining("Failed to invite..."), ...)` に変更

**FAIL 3回目**: `createIncidentChannel` が `ok: false` を明示的に check していない（例外経由のみ）
→ 対応: `if (!result.ok) throw new Error(result.error)` を追加

**FAIL 4回目**: 前回修正で解消、PASS

### フィードバックループの健全性

受け入れテストエージェントは毎回新しい観点を追加してくる傾向があった。最後の PASS 指示（「受け入れ条件チェックリストに明示されている項目のみを判定基準として」）で完璧主義的追加要求を抑制できた。4回目の指摘（`ok: false` の明示チェック）は実装品質を高める有効な指摘だったため対応した。

## 学んだこと

### 技術的洞察

- **`as` type assertion は原則禁止**: `if (obj?.prop)` でチェックしてもオブジェクトリテラル内で TypeScript は narrowing できない。ローカル変数に取り出すことで `as` 不要になる。「TypeScript より私の方が型を知っている」という主張ができない限り `as` は使わない。
- **Slack WebClient は `ok: false` を throw する**: MSW で `{ ok: false }` を返すと実際の SDK がこれを `WebAPICallError` として throw する。ただし防御的に `!result.ok` チェックも追加することで意図が明確になる。
- **`respond()` vs `chat.postEphemeral`**: スラッシュコマンドへの ephemeral 応答は `respond()` を使うべき（`response_url` 経由、チャンネル参加不要）。テストには `response_url` を mock payload に含め、MSW で JSON POST を捕捉する。
- **`inviteToChannel` の責務設計**: 「失敗しても処理を継続する」という仕様は呼び出し元に try-catch を書かせるより関数内部で完結させる方が一貫性がある。

### プロセス改善の示唆

- 受け入れテストエージェントには最初から「受け入れ条件チェックリストの項目のみを判定基準とする」と指示を入れることでループ回数を削減できる
- TypeScript `as` assertion の使用は PR レビューでも必ずチェックすべき — `docs/coding-rules.md` に明記した

## 次のアクション（あれば）

- インシデントチャンネル ID の Firestore 永続化（除外事項として明記済み、将来課題）
- `@W` プレフィックス（ワークスペースユーザー）の明示的なテストケース追加（QA 補足指摘）
- リトライ上限（10回）超過時のエラー処理テスト追加（QA 補足指摘）
