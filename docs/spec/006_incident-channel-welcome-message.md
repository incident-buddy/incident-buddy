# インシデントチャンネルへのウェルカムメッセージ投稿

## 要求仕様

- インシデント宣言者が `/inc` コマンドでインシデントを起票したとき、自動作成されるインシデント専用 Slack チャンネルの最初のメッセージとして、インシデント詳細を自動投稿したい
- これにより、チャンネルに招待・参加したメンバーが「何のインシデントか」を即座に把握できる

## 機能仕様

### 正常系

- インシデント宣言モーダル送信後、インシデント専用チャンネルが作成される
- チャンネル作成後（ユーザー招待後を含む）、そのチャンネルにウェルカムメッセージが投稿される
- ウェルカムメッセージには以下の情報が含まれる：
  - インシデントタイトル（`title`）
  - 重大度（`severity`）
  - サービス名（`serviceName`）
  - 説明（`description`）
  - 宣言者（`createdByName`）
- ウェルカムメッセージはコンフィグファイルの有無に関わらず常に投稿される

### 異常系・エッジケース

- `chat.postMessage` 失敗時はエラーが上位に伝播し、既存の `postError` ハンドラーが処理する
- `serviceName` が空文字の場合はサービス名フィールドを表示しない（または空白のままにする）
- `description` が空文字の場合は説明フィールドを表示しない

## 実装方針

### 変更対象コンポーネント

1. **`features/incident/incident.presenter.ts`**
   - `buildChannelWelcomeMessage(incident: Incident)` を追加
   - title / severity / serviceName / description / createdByName を含む Slack ブロックを返す純粋関数

2. **`slack/handlers/actions.ts`**
   - `inviteToChannel` の後（または config ブロックの前）に `buildChannelWelcomeMessage` を呼び、`chat.postMessage` でインシデントチャンネルへ投稿

### 技術的アプローチ

- `buildChannelWelcomeMessage` は `buildIncidentMessage` と異なる用途（インシデントチャンネル内の詳細掲示用）のため別関数として実装する
- 投稿タイミング: `inviteToChannel` 呼び出し後に投稿する（招待されたユーザーがチャンネルに入ったときに既にメッセージが見える状態にする）
- ウェルカムメッセージはコンフィグの有無に依存しないため、`if (!configPath) return` の前に配置する

## 受け入れ条件

- [ ] インシデント宣言後、インシデントチャンネルにウェルカムメッセージが投稿される
- [ ] ウェルカムメッセージに title / severity / description / 宣言者名が含まれる
- [ ] `chat.postMessage` 失敗時、エラーが `postError` まで伝播しエラーメッセージが宣言チャンネルに投稿される

## 除外事項

- ウェルカムメッセージの後から編集・更新する機能（F: Slack メッセージ自動更新）は今回のスコープ外
- チャンネルトピックへの設定（J: チャンネルトピック自動設定）は今回のスコープ外
