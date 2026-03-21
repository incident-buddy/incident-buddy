# インシデントチャンネルへのウェルカムメッセージ投稿

## 要求仕様

- インシデント宣言者が `/inc` コマンドでインシデントを起票したとき、自動作成されるインシデント専用 Slack チャンネルの最初のメッセージとして、インシデント詳細を通常投稿（全員可視）したい
- これにより、チャンネルに参加したメンバーが「何のインシデントか」を即座に把握できる

## 機能仕様

### 正常系

- インシデント宣言モーダル送信後、インシデント専用チャンネルが作成される
- チャンネル作成後、`chat.postMessage` でウェルカムメッセージをチャンネルに投稿する
- ウェルカムメッセージには以下の情報が含まれる：
  - インシデントタイトル（`title`）
  - 重大度（`severity`）
  - サービス名（`serviceName`）
  - 説明（`description`）
  - 宣言者名（`createdByName`）
- ウェルカムメッセージはコンフィグファイルの有無に関わらず常に投稿される

### 異常系・エッジケース

- ウェルカムメッセージの `chat.postMessage` 失敗時はエラーが上位に伝播し、既存の `postError` ハンドラーが処理する
- `serviceName` が空文字の場合はサービス名フィールドを表示しない
- `description` が空文字の場合は説明フィールドを表示しない

## 実装方針

### 変更対象コンポーネント

1. **`features/incident/incident.presenter.ts`**
   - `buildChannelWelcomeMessage(incident: Incident)` を追加
   - title / severity / serviceName / description / createdByName を含む Slack ブロックを返す純粋関数

2. **`slack/handlers/actions.ts`**
   - `if (!configPath) return` の前に `buildChannelWelcomeMessage` を呼び、`chat.postMessage` でインシデントチャンネルへ投稿

### 技術的アプローチ

- `buildChannelWelcomeMessage` は `buildIncidentMessage` と異なる用途（インシデントチャンネル内の詳細掲示用）のため別関数として実装する
- ウェルカムメッセージ投稿はコンフィグ有無に依存しないため `if (!configPath) return` の前に配置する

## 受け入れ条件

- [ ] インシデント宣言後、インシデントチャンネルにウェルカムメッセージが投稿される
- [ ] ウェルカムメッセージに title / severity / description / 宣言者名が含まれる
- [ ] ウェルカムメッセージの `chat.postMessage` 失敗時、エラーが `postError` まで伝播する

## 除外事項

- ユーザーが手動でチャンネルに参加したときの ephemeral 通知（`member_joined_channel` イベントのサブスクライブが必要で変更が大きいため今回のスコープ外）
- `/inc join` コマンド（Feature B）での参加時の ephemeral 通知は Feature B のスコープ
- ウェルカムメッセージの後から編集・更新する機能（F: Slack メッセージ自動更新）は今回のスコープ外
- チャンネルトピックへの設定（J: チャンネルトピック自動設定）は今回のスコープ外
