# インシデント Slack メッセージの自動更新

## 要求仕様

- システムとして、インシデントの状態変化（対応者追加・重大度変更・解決）のたびに `#incidents` 等に投稿済みのメッセージを最新状態に更新したい
- これにより、チャンネルを見るだけで現在のインシデント状態が把握できる

## 機能仕様

### 正常系

- `slackMessageTs` が設定されているインシデントに対して `refreshIncidentSlackMessage(incidentId, client)` を呼ぶと、`chat.update` が実行される
- `chat.update` に渡すメッセージは `buildIncidentMessage(incident, { incidentChannelId })` で再構築される
- `incidentChannelId` が設定済みの場合、更新メッセージには対応チャンネルへのリンクが含まれる
- `incidentChannelId` が未設定の場合、リンクなしで更新される

### 異常系・エッジケース

- `slackMessageTs` が空文字の場合は `chat.update` を呼ばずに早期リターンする
- `findById` が `null` を返した場合は `Error` をスローする
- `chat.update` が `ok: false` を返した場合は `Error` をスローする

## 受け入れ条件

- [ ] `refreshIncidentSlackMessage` が `actions.ts` からエクスポートされている
- [ ] `slackMessageTs` がセットされたインシデントに対して呼ぶと、`chat.update` が `slackChannelId` + `slackMessageTs` で呼ばれる
- [ ] 更新メッセージに現在の `Incident` の title・severity・status が反映されている
- [ ] `incidentChannelId` がある場合、更新メッセージにチャンネルリンクが含まれる
- [ ] `slackMessageTs` が空文字の場合、`chat.update` が呼ばれない
- [ ] `chat.update` の `ok: false` 時はエラーをスロー

## 除外事項

- B（`/inc join`）・A（`/inc resolve`）・I（`/inc severity`）の実装
- `refreshIncidentSlackMessage` を実際の状態変化イベントに繋ぎ込む処理
