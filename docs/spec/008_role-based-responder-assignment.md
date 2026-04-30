# ロールベースの対応者アサイン

## 要求仕様

- As a インシデント対応チームのメンバー, I want to ウェルカムメッセージのボタンを押すだけで自分を特定ロール（コマンダー・調査担当など）にアサインできる, so that チャンネルに入った直後から「誰が何をするか」を明確にでき、混乱を防げる

## 機能仕様

### 正常系

- `incident-config` の `## Roles` セクションで定義されたロールごとに「[ロール名]になる」ボタンをウェルカムメッセージに表示する
- ウェルカムメッセージには現在の担当者一覧（`ロール名: @userName`）も表示する
- ボタンを押すと：
  1. インシデントの `responders` に `{ roleId, userId, userName }` が追加される
  2. ウェルカムメッセージが `chat.update` で更新され、担当者一覧が反映される
  3. `#incidents` のインシデントメッセージも `refreshIncidentSlackMessage` で更新される
  4. インシデントチャンネルに「@userName が [ロール名] になりました」通知が投稿される
  5. timeline に `type: "responder_added"` として記録される
- ロール制約（上限人数など）は設定ファイルに記載するが UI ガイドのみ（システム強制なし）

### 異常系・エッジケース

- すでに同じロールにアサイン済みのユーザーが再度ボタンを押した場合、ephemeral で「既にアサイン済みです」と返す（Firestore 更新・timeline 記録は行わない）
- `chat.update`（ウェルカムメッセージ更新）が失敗した場合はエラーをスローし `postError` で処理
- `refreshIncidentSlackMessage`（`#incidents` 更新）失敗時はログのみで処理継続（アサイン自体は成功扱い）
- チャンネルへの通知投稿（`chat.postMessage`）失敗時はログのみで処理継続

### 技術的アプローチ

**ロール設定ファイル形式**:
```markdown
## Roles

### commander
インシデントコマンダー
インシデント全体を指揮する。

### investigator
調査担当者
原因究明を担当する。
```

- `### {role-id}` 形式（ケバブケース）で定義。既存の parser パターンと一致する
- `id` は H3 見出しから取得、`label` は description 1 行目を使う（descriptionが存在しなければ id をそのまま使う）

## 受け入れ条件

- [ ] ウェルカムメッセージに `incident-config` のロール数だけ「[ロール名]になる」ボタンが表示される
- [ ] ボタン押下で `incidentService.addResponder` が呼ばれ `responders` にエントリが追加される
- [ ] ウェルカムメッセージが更新され担当者名が反映される
- [ ] `#incidents` のインシデントメッセージが `refreshIncidentSlackMessage` で更新される
- [ ] インシデントチャンネルにアサイン通知が投稿される
- [ ] timeline に `responder_added` イベントが記録される
- [ ] 重複アサイン時に ephemeral でエラーが返り、Firestore は変更されない
- [ ] `actions.ts` 内で `incidentRepository` を直接参照していない

## 除外事項

- アンアサイン（自身を担当から外す）機能
- ロール制約のシステム強制（上限超過時のエラー）
- 他者を代理でアサインする機能
- ロールラベルの多言語対応
