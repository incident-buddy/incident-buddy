# スラッシュコマンドエラー通知

## 要求仕様

- As a Slack ユーザー、`/inc` コマンドまたはインシデント作成フォームの送信がアプリケーション内部の例外により失敗した場合、そのチャンネルに失敗の旨とエラーメッセージが投稿されることを期待する
- As a Slack ユーザー、エラーメッセージを見ることで何が起きたかを把握し、管理者やオンコール担当者にエスカレーションできる

## 機能仕様

### 正常系

- 例外が発生しない場合、既存の動作と変わらない

### 異常系・エッジケース

- `/inc` コマンドハンドラー（`commands.ts`）で `ack()` 以降の処理が例外を投げた場合:
  - コマンドを実行したチャンネルにエラーメッセージを公開投稿する
  - 投稿内容: 失敗の旨 + 例外の `message`
- `create_incident` ビュー送信ハンドラー（`actions.ts`）で `ack()` 以降の処理が例外を投げた場合:
  - `private_metadata` から取得した `channel_id` のチャンネルにエラーメッセージを公開投稿する
  - 投稿内容: 失敗の旨 + 例外の `message`
- エラー投稿自体（`client.chat.postMessage`）が失敗した場合:
  - アプリをクラッシュさせない（`console.error` でログのみ）
- `channel_id` が取得できない場合:
  - エラー投稿は行わず、`console.error` でログのみ

## 実装方針

### 変更対象コンポーネント

- `api/src/slack/handlers/commands.ts` — `/inc` ハンドラーに try-catch を追加
- `api/src/slack/handlers/actions.ts` — `create_incident` ハンドラーに try-catch を追加

### 技術的アプローチ

1. 共通エラー投稿ユーティリティ関数を `api/src/slack/handlers/post-error.ts` に作成する:
   ```typescript
   async function postError(client, channelId, error): Promise<void>
   ```
2. 各ハンドラーで `ack()` 以降のロジックを try-catch で囲み、catch ブロックで `postError` を呼ぶ
3. channel_id の取得元:
   - `commands.ts`: `body.channel_id`
   - `actions.ts`: `JSON.parse(view.private_metadata).channel_id`（すでに取得済み）
4. エラーメッセージ形式:
   ```
   コマンドの実行に失敗しました
   エラー: {error.message}
   ```

## 受け入れ条件

- [ ] `/inc` コマンドハンドラーで例外が発生したとき、コマンドを実行したチャンネルにエラーメッセージが公開投稿される
- [ ] `create_incident` ビュー送信ハンドラーで例外が発生したとき、元のチャンネルにエラーメッセージが公開投稿される
- [ ] エラーメッセージに例外の `message` が含まれる
- [ ] エラー投稿自体が失敗してもアプリがクラッシュしない

## 除外事項

- `ack()` 自体の失敗（Slack 側の問題であり、アプリ側でのハンドリング対象外）
- `/inc config` サブコマンドのエラー（設定確認コマンドは ephemeral で表示済みであり、既存のエラーハンドリングで対応）
- グローバルな Bolt `app.error()` ハンドラーの導入（channel_id を取得できないため、要件を満たせない）
