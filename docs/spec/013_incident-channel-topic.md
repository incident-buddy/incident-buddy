# インシデントチャンネルのトピック自動設定

## 要求仕様

- As a インシデント対応者, I want to チャンネル一覧を見るだけで各インシデントの重大度・タイトル・状態を把握できる, so that チャンネルを開かずに状況を確認・優先度付けができる
- As a 関係者（対応チーム外）, I want to チャンネル参加前にトピックで内容を確認できる, so that 自分が参加すべきインシデントかを素早く判断できる

## 機能仕様

### 正常系

1. インシデント作成時: チャンネル作成後に `conversations.setTopic` を呼び出し、`[{severity}] {title} - 対応中` をトピックにセットする
   - 例: `[Critical] DB障害 - 対応中`
   - severity はユーザー定義値をそのまま使用（`Critical` / `P1` / 任意の文字列）
2. インシデント解決時: `resolve_incident_modal` 送信処理内で `[Resolved] {title}` に更新する
   - 例: `[Resolved] DB障害`

### 異常系・エッジケース

- `conversations.setTopic` が失敗した場合（権限不足・API エラー）: コンソールにログのみ出力し、インシデント作成・解決の処理は継続する（例外を伝播しない）
- Slack Bot に `conversations:write` スコープがない場合: 同上のログのみ挙動
- 解決済みインシデントへの二重解決: クローズ機能（spec/010）の既存ガードに委ねる（このアイテムでは追加対応なし）

## 実装方針

### `api/src/slack/handlers/incident-channel.ts`

- `SlackClient` 型に `conversations.setTopic` を追加する

  ```typescript
  setTopic: (args: {
    channel: string;
    topic: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  ```

- `setChannelTopic({ client, channelId, topic })` を追加する
  - `inviteToChannel` と同様に try-catch 自己完結（失敗はログのみ、例外を伝播しない）
  - `result.ok` を明示チェックする
  - `as` 型アサーションを使わない

### `api/src/slack/handlers/actions.ts`（`create_incident` ハンドラー）

- チャンネル作成・招待後に `setChannelTopic` を呼ぶ
- トピック文字列 `[{severity}] {title} - 対応中` の組み立てはハンドラー内で行う

### `api/src/slack/handlers/actions.ts`（`resolve_incident_modal` view_submission ハンドラー）

- `tryPostResolveNotification` 等と並列して `trySetResolvedChannelTopic()` を追加する
- 内部 try-catch 自己完結（`tryXxx()` 命名規則に従う）

## 受け入れ条件

- [ ] インシデント作成後、チャンネルトピックが `[Critical] DB障害 - 対応中` 形式でセットされている
- [ ] ユーザー定義の severity 値（例: `P1`）もそのまま反映される
- [ ] インシデント解決後、トピックが `[Resolved] DB障害` 形式に更新されている
- [ ] `conversations.setTopic` が失敗してもインシデント作成・解決の処理が継続し、Slack ユーザーにエラーが表示されない
- [ ] `as` 型アサーションを使っていない
- [ ] `result.ok` を明示チェックしている

## 除外事項

- severity 変更時のトピック更新（`/inc severity` 実装後の後続タスク）
- タイトル変更時のトピック更新
- チャンネルアーカイブ時のトピック操作
