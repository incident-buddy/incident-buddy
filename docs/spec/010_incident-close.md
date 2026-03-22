# インシデントのクローズ

## 要求仕様

- As a インシデントチャンネルのメンバー, I want to ウェルカムメッセージの「インシデントの解決」ボタンからインシデントをクローズできる, so that 対応完了の事実と解決経緯を記録しながらチームに通知できる

## 機能仕様

### 正常系

1. ウェルカムメッセージに「インシデントを解決する」ボタンを表示する（`status: open` の時のみ）
2. ボタンを押すと確認モーダルが開く
   - モーダルにはインシデントタイトルを表示する
   - 任意入力の説明文フィールド（プレースホルダー: 「例：再起動で解決した」）
3. モーダルで OK 後、以下を順に実行する
   1. `status: resolved`・`resolvedAt`（現在時刻）・`resolvedBy`（userId）・`resolvedByName`（userName）を Firestore に書き込む
   2. timeline に `type: "resolved"` イベント（actorId, actorName, note=説明文）を記録する
   3. `#incidents` チャンネルのインシデントメッセージを更新する（グリーンサイドバー + ✅ RESOLVED + 解決者名・解決日時）
   4. ウェルカムメッセージを「解決済み」表示に更新する（ロールボタン・解決ボタンを非表示、解決者名・解決日時・経過時間を表示）
   5. インシデントチャンネルに解決通知を投稿する（`✅ @yamada がインシデントをクローズしました / 経過時間: 2h 30m`）

### 異常系・エッジケース

- すでに `status: resolved` のインシデントに対してボタンを押した場合: ephemeral で「このインシデントはすでに解決済みです」と返し、モーダルを開かない（Firestore 更新なし）
- Firestore 更新が失敗した場合: エラーを上位に伝播し `postError` ハンドラーが処理する
- `#incidents` メッセージ更新が失敗した場合: ログのみで処理継続
- ウェルカムメッセージ更新が失敗した場合: ログのみで処理継続
- インシデントチャンネルへの通知投稿が失敗した場合: ログのみで処理継続

## 実装方針

### 変更対象コンポーネント

**`db/types.ts`**
- `IncidentDoc` に `resolvedBy: string | null` と `resolvedByName: string | null` を追加
- `AddTimelineEventInput`（`occurredAt: Date`）を新規定義し、repository が内部で `Timestamp.fromDate()` に変換する

**`features/incident/incident.model.ts`**
- `Incident` 型に `resolvedBy: string | null` と `resolvedByName: string | null` を追加
- `AlreadyResolvedError extends Error` を export（ビジネスルールの表現）

**`features/incident/incident.repository.ts`**
- `addTimelineEvent()` の引数型を `AddTimelineEventInput`（`occurredAt: Date`）に変更し、内部で `Timestamp.fromDate(occurredAt)` に変換（既存バグ修正）
- `resolve()` を修正: 引数に `resolvedAt: Date`・`resolvedBy`・`resolvedByName` を追加し、`Timestamp.fromDate(resolvedAt)` で書き込む（`FieldValue.serverTimestamp()` は不使用）
- `toDomain()` に `resolvedBy: doc.resolvedBy ?? null`・`resolvedByName: doc.resolvedByName ?? null` のマッピングを追加

**`features/incident/incident.service.ts`**
- `addResponder()` 内の `Timestamp.now()` を `new Date()` に修正（既存バグ修正）
- `resolve(incidentId, userId, userName, note?)` を追加:
  - `status === "resolved"` なら `AlreadyResolvedError` をスロー
  - `const resolvedAt = new Date()` で生成（Timestamp 不使用）
  - `incidentRepository.resolve()` + `incidentRepository.addTimelineEvent()` を呼ぶ
  - `findById()` で更新後の Incident を返す

**`features/incident/incident.presenter.ts`**
- `buildResolveConfirmModal(incident)` を追加: `private_metadata` に `{ incidentId, incidentChannelId }` を JSON 文字列で埋め込む
- `buildChannelWelcomeMessage()` を更新:
  - `status: "open"` の時のみ「インシデントを解決する」ボタン（`action_id: "resolve_incident"`）を表示
  - `status: "resolved"` の時: ロールボタン・解決ボタン非表示、解決者名・解決日時・経過時間を表示
  - 経過時間は `formatElapsedTime(createdAt, resolvedAt)` ヘルパーで計算（60分未満 → `X分`、60分以上 → `Xh Ym`）
- `buildIncidentMessage()` を更新: `status: "resolved"` の時、`color: "#2EB67D"`（グリーン）・✅ RESOLVED・解決者名・解決日時を表示

**`slack/handlers/actions.ts`**
- `resolve_incident` アクションハンドラーを追加:
  - 既に resolved なら ephemeral で「すでに解決済みです」を返す
  - open なら `buildResolveConfirmModal()` でモーダルを開く
- `resolve_incident_modal` view_submission ハンドラーを追加:
  - `ack()` を先頭で呼ぶ（Slack 3秒制限対応）
  - `private_metadata` を `zod` でパース（`as` 不使用）
  - `incidentService.resolve()` を呼ぶ（`AlreadyResolvedError` は `postError` に伝播）
  - 以下3処理は内部 `try-catch` で自己完結した関数として切り出す:
    - `tryUpdateWelcomeMessage()`: ウェルカムメッセージを resolved 状態で更新
    - `tryRefreshIncidentSlackMessage()`: `#incidents` メッセージ更新
    - `tryPostResolveNotification()`: チャンネル解決通知を投稿

### 技術的決定事項

- **経過時間の計算起点**: `incident.createdAt`（`resolvedAt - createdAt` でリードタイムを計算）
- **解決権限**: 制限なし（インシデントチャンネルメンバーであれば誰でも解決可能）
- **`private_metadata` の型安全化**: `zod` を使用（`z.object({ incidentId: z.string(), incidentChannelId: z.string() })`）
- **`addTimelineEvent()` の型設計**: `TimelineEventDoc` は変更せず、`AddTimelineEventInput`（`occurredAt: Date`）を `db/types.ts` に新設

## 受け入れ条件

- [ ] ウェルカムメッセージに「インシデントを解決する」ボタンが表示される（status: open のみ）
- [ ] ボタン押下で確認モーダルが開き、モーダルにインシデントタイトルが表示される
- [ ] すでに resolved のインシデントへの再トリガーで ephemeral エラーが返り Firestore 更新されない
- [ ] 確認 OK 後、`status: resolved` と `resolvedAt` が Firestore に書き込まれる
- [ ] timeline に `resolved` イベント（説明文含む）が記録される
- [ ] `#incidents` メッセージがグリーンサイドバー + RESOLVED + 解決者名・解決日時で更新される
- [ ] ウェルカムメッセージが解決済み表示に更新され、ロールボタン・解決ボタンが消える
- [ ] インシデントチャンネルに解決通知（解決者名 + 経過時間）が投稿される
- [ ] `incidentService.resolve` と `incidentService.addResponder` で `Timestamp` 型を使用しない

## 除外事項

- 解決操作を行えるユーザーの権限制限（誰でも可）
- インシデントの再オープン機能
- ポストモーテムテンプレート自動生成
- チャンネルトピックの「Resolved」更新
- `/inc resolve` スラッシュコマンド
- 解決後のインシデントチャンネルのアーカイブ
