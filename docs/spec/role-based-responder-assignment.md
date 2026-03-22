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

## 実装方針

### 変更対象コンポーネント

| ファイル | 変更内容 |
|--------|--------|
| `features/incident-config/incident-config.model.ts` | `RoleDef { id, label, description }` 型追加、`IncidentConfig` に `roles: RoleDef[]` 追加 |
| `features/incident-config/incident-config.parser.ts` | `## Roles` セクションのパース追加（`### {role-id}` 形式） |
| `features/incident-config/incident-config.service.ts` | `loadConfig` の `KNOWN_SECTIONS` 正規表現に `Roles` を追加 |
| `features/incident/incident.model.ts` | `Responder { roleId, userId, userName }` 型追加、`responderIds: string[]` → `responders: Responder[]` 変更 |
| `db/types.ts` | `IncidentDoc` の `responderIds` → `responders`、`welcomeMessageTs?: string` 追加 |
| `features/incident/incident.repository.ts` | `toDomain()` 更新、`addResponder()` / `findByChannelId()` / `updateWelcomeMessageTs()` 追加 |
| `features/incident/incident.service.ts` | `findById()` と `addResponder()` 追加（timeline 書き込みも実施） |
| `features/incident/incident.presenter.ts` | `buildChannelWelcomeMessage(incident, roles)` にロールボタン＋担当者一覧を追加 |
| `slack/handlers/actions.ts` | `refreshIncidentSlackMessage` を `incidentService.findById()` に変更、welcome message ts 保存、`assign_role_{roleId}` ハンドラー追加 |

### 技術的アプローチ

**ロール設定ファイル形式**:
```markdown
## Roles

### commander
コマンダー。インシデント全体を指揮する。

### investigator
調査担当。原因究明を担当する。
```

- `### {role-id}` 形式（ケバブケース）で定義。既存の parser パターンと一致する
- `id` は H3 見出しから取得、`label` は description 1 行目の `。` 前を使う（または id をそのまま使う）

**ウェルカムメッセージ更新のための ts 保存**:
- `actions.ts` の `create_incident` ハンドラーで `welcomeResult.ts` を `incidentRepository.updateWelcomeMessageTs()` で保存

**インシデントのルックアップ**:
- アクションハンドラーは `body.channel.id`（インシデントチャンネル ID）から `incidentRepository.findByChannelId()` でインシデントを取得

**アーキテクチャ修正**:
- `refreshIncidentSlackMessage` 内の `incidentRepository.findById()` を `incidentService.findById()` に変更し、`actions.ts` から `incidentRepository` の直接参照をなくす

### アクションハンドラーのフロー（`assign_role_{roleId}`）

```
1. ack()
2. body.channel.id → incidentRepository.findByChannelId() → incident
3. incident.responders で重複チェック → 同一 userId + roleId が既存なら ephemeral で返す
4. incidentService.addResponder(incidentId, roleId, userId, userName) → responders 更新 + timeline 記録
5. ロール config を loadConfig() で取得し、buildChannelWelcomeMessage(updatedIncident, roles) でウェルカムメッセージを再構築
6. chat.update(welcomeMessageTs) → 失敗時は throw → postError
7. refreshIncidentSlackMessage() → 失敗時はログのみ（try-catch 内部完結）
8. chat.postMessage("@userName が [ロール名] になりました") → 失敗時はログのみ
```

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
