# インシデント登録時の通知方法の変更（チャンネル招待＋個別通知）

## 要求仕様

- As a インシデント対応チームのメンバー, I want to インシデント発生時に自動でインシデントチャンネルに招待されメンションを受け取りたい, so that 事前にbotをチャンネルへ招待しておく運用が不要になり、通知漏れを防げる

## 機能仕様

### 正常系

- インシデント宣言後、Notification Rules にマッチした全ルールから `mention:` のユーザーを重複排除してインシデントチャンネルに招待する
  - `@channel` / `@here` は招待対象外
  - `@S...` はグループIDとして展開（`resolveInvitees` の既存動作を再利用）
  - 複数ルールにまたがる同一ユーザーは1回のみ招待
- 招待した各ユーザーに対して `<@UXXX> を招待しました` をインシデントチャンネルに1通ずつ投稿する
  - グループ展開後の各ユーザーも同様（5人グループなら5投稿）
- invitees が空の場合は招待・通知投稿をスキップ

### 異常系・エッジケース

- 招待失敗（API エラー・ユーザー未存在）: ログのみ、処理継続（`inviteToChannel` 既存仕様と同じ）
- 招待通知 `chat.postMessage` 失敗: ログのみ、次のユーザーの投稿に進む
- 設定ファイルなし（`INCIDENT_CONFIG_PATH` 未設定）: 招待・通知なし
- `@channel` / `@here` のみが `mention:` に書かれている: invitees が空になりスキップ

## 実装方針

### 変更対象コンポーネント

| ファイル | 変更内容 |
|--------|---------|
| `api/src/features/incident-config/incident-config.model.ts` | `NotificationRule.actions` から `channels: string[]` を削除 |
| `api/src/features/incident-config/incident-config.parser.ts` | `key === "channel"` ブランチを削除、`actions` 初期化から `channels: []` を削除 |
| `api/src/slack/handlers/actions.ts` | 外部チャンネルへの通知ループ（`for (const rule of matched) { for (const channel of ...) }`）を削除し、招待済みの各 userId に `<@userId> を招待しました` を投稿 |
| `incident-config.md`（ルート） | 各 Notification Rule の `channel:` 行を削除 |
| `docs/spec/001_notification-rules-from-markdown/incident-config.md` | 同様に `channel:` 行を削除 |

### 技術的アプローチ

- `inviteToChannel` は既存実装を再利用（エラーハンドリング込み）
- `resolveInvitees` は既存実装を再利用（`@S...` グループ展開・`@channel`/`@here` 除外）
- 招待通知投稿は `try-catch` で囲み、失敗時はログのみで次のユーザーへ継続

## 受け入れ条件

- [ ] `NotificationRule` 型に `channels` フィールドが存在しない
- [ ] パーサーが `channel:` キーを無視する（解析されない）
- [ ] インシデント宣言後、マッチルールのユーザーがインシデントチャンネルに招待される
- [ ] 複数ルールにまたがる同一ユーザーは1回だけ招待される
- [ ] 招待された各ユーザーに `<@UXXX> を招待しました` が個別投稿される
- [ ] `@S...` グループも展開後の各ユーザーに個別投稿される
- [ ] `@channel` は招待対象にならない
- [ ] 招待通知 `chat.postMessage` 失敗時はログのみで次のユーザー処理が継続される

## 除外事項

- 既存設定ファイルを持つユーザーへのマイグレーションガイド（セルフホストなので個別対応）
- 外部チャンネルへの通知機能の後方互換性維持
