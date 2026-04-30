# インシデントチャンネル ID の Firestore 永続化

## 要求仕様

- インシデント宣言者が `/inc` コマンドでインシデントを起票したとき、システムが自動生成するインシデント専用 Slack チャンネルの ID を Firestore の `incidents` ドキュメントに保存したい
- これにより、後続機能（チャンネルへのメッセージ投稿・更新・join コマンドなど）がチャンネル ID を参照できるようになる
- ローカル環境では、Firestore Emulatorを用いる

## 機能仕様

### 正常系

- インシデント宣言モーダルの送信後、インシデントレコードが Firestore に作成される
- `createIncidentChannel()` でインシデント専用チャンネルが作成される
- 作成されたチャンネルの ID が `incidents/{id}.incidentChannelId` として保存される

### 異常系・エッジケース

- チャンネル作成失敗時はエラーを上位に伝播し、既存の `postError` ハンドラーが処理する（変更なし）
- `updateIncidentChannelId` 失敗時はエラーを上位に伝播する

### 技術的アプローチ

- `updateSlackMessageTs` と同じパターンで `FieldValue.serverTimestamp()` を使って `updatedAt` を更新する
- `incidentChannelId` はオプションフィールド（`?: string`）にする。作成直後は未設定で、`updateIncidentChannelId` 呼び出し後に値が入る

## 受け入れ条件

- [ ] インシデント宣言後、Firestore の `incidents` ドキュメントに `incidentChannelId` フィールドが保存されている
- [ ] `incidentChannelId` の値が実際に作成された Slack チャンネルの ID と一致している

## 除外事項

- `incidentChannelId` を使った後続機能（チャンネルへのメッセージ投稿、`/inc join` でのルックアップ等）は今回のスコープ外
- チャンネル名（`name`）の永続化は今回対象外（ID のみ）
